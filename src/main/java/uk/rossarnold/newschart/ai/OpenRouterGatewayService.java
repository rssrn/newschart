package uk.rossarnold.newschart.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.openai.errors.BadRequestException;
import com.openai.errors.InternalServerException;
import com.openai.errors.OpenAIIoException;
import com.openai.errors.RateLimitException;
import com.openai.errors.UnauthorizedException;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.metadata.ChatResponseMetadata;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import uk.rossarnold.newschart.ai.metadata.Metadata;
import uk.rossarnold.newschart.ai.metadata.MetadataRepository;
import uk.rossarnold.newschart.callout.Callout;
import uk.rossarnold.newschart.callout.CalloutType;
import uk.rossarnold.newschart.callout.LlmCallout;
import uk.rossarnold.newschart.news.highlights.CountryNews;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class OpenRouterGatewayService {
    private final ChatClient chatClient;
    private final MeterRegistry meterRegistry;
    private final ThreadPoolTaskScheduler taskScheduler;
    private final WebClient webClient;
    private final MetadataRepository metadataRepository;
    private final LlmResponseMapper llmResponseMapper;

    // OpenRouter reserves credit for prompt + max_tokens before running a request, so an
    // unset ceiling defaults to the model's own maximum (8k-128k depending on model) and
    // makes calls unaffordable long before the balance is actually spent. Observed output
    // is 604-1616 tokens per call, so 4000 leaves ample headroom against truncation.
    private final int maxTokens;

    record GenerationResponse(GenerationData data) {
    }

    record GenerationData(@JsonProperty("total_cost") double totalCost) {
    }

    private static final Logger log = LogManager.getLogger(OpenRouterGatewayService.class);

    static final String MAIN_SUMMARY_MODEL = "openai/gpt-oss-120b:free";

    // secondary call to get OpenRouter cost data needs a delay since it doesn't populate immediately
    private static final int GENERATION_CALL_DELAY = 35;

    static final String OPENROUTER_GETCALLOUTS_EXHAUSTED = "openrouter.getcallouts.exhausted";
    static final String OPENROUTER_SUMMARISESTORIES_EXHAUSTED = "openrouter.summarisestories.exhausted";

    // A schema violation is thrown by the JSON binding, after the HTTP call has already returned,
    // so @Retryable never sees it and OPENROUTER_GETCALLOUTS_EXHAUSTED never moves. Counted
    // separately so a silently-dropped response is visible rather than only showing up as a
    // missing source on the map.
    static final String OPENROUTER_GETCALLOUTS_PARSE_FAILURES = "openrouter.getcallouts.parse.failures";

    // Tag values for the above. Both series are pre-registered per model so the tag keys stay
    // consistent - the Prometheus registry rejects the same meter name carrying different keys.
    static final String REASON_UNPARSEABLE = "unparseable";
    static final String REASON_UNRESOLVABLE_COUNTRY = "unresolvable_country";

    public OpenRouterGatewayService(OpenAiChatModel chatModel,
                                    MeterRegistry meterRegistry,
                                    ThreadPoolTaskScheduler taskScheduler,
                                    @Qualifier("openRouterWebClient") WebClient webClient,
                                    MetadataRepository metadataRepository,
                                    LlmResponseMapper llmResponseMapper,
                                    @Value("${openrouter.max-tokens:4000}") int maxTokens) {
        this.maxTokens = maxTokens;
        this.llmResponseMapper = llmResponseMapper;
        this.chatClient = ChatClient.create(chatModel);
        this.meterRegistry = meterRegistry;
        this.taskScheduler = taskScheduler;
        this.webClient = webClient;
        this.metadataRepository = metadataRepository;
        meterRegistry.counter(OPENROUTER_GETCALLOUTS_EXHAUSTED); // pre-register to expose baseline 0 value
        meterRegistry.counter(OPENROUTER_SUMMARISESTORIES_EXHAUSTED);
    }

    // workaround so the required return format is unambiguous - bare list can confuse the LLM
    public record LlmCalloutList(List<LlmCallout> items) {
    }

    @Retryable(
            retryFor = {
                    OpenAIIoException.class,       // Network/timeout issues
                    InternalServerException.class, // 500, 502, 503, 504 Server errors
                    RateLimitException.class       // 429 Too Many Requests
            },
            noRetryFor = {
                    BadRequestException.class,     // 400 Bad Request
                    UnauthorizedException.class    // 401 Unauthorized
            },
            backoff = @Backoff(delayExpression = "${openrouter.retry.delay-ms:30000}", multiplier = 2)
    )
    public Optional<StoryOutline> summariseStories(CountryNews countryNews) {
        String prompt = AiPrompts.buildSummariseStoriesPrompt(countryNews);
        log.info("Calling OpenRouter {} to summarise stories", MAIN_SUMMARY_MODEL);
        log.debug("... with prompt: {}", prompt);

        return Optional.ofNullable(
                chatClient.prompt()
                        .user(prompt)
                        .options(OpenAiChatOptions.builder()
                                .model(MAIN_SUMMARY_MODEL)
                                .maxTokens(maxTokens))
                        .call()
                        .entity(StoryOutline.class)
        );
    }

    /**
     * Use LLM to generate top news stories for today.
     *
     * @return list of story callouts suggested by the LLM
     */
    @Retryable(
            retryFor = {
                    OpenAIIoException.class,       // Network/timeout issues
                    InternalServerException.class, // 500, 502, 503, 504 Server errors
                    RateLimitException.class       // 429 Too Many Requests
            },
            noRetryFor = {
                    BadRequestException.class,     // 400 Bad Request
                    UnauthorizedException.class    // 401 Unauthorized
            },
            backoff = @Backoff(delayExpression = "${openrouter.retry.delay-ms:30000}", multiplier = 2)
    )
    public Optional<List<Callout>> getCallouts(String model) {
        log.info("Calling OpenRouter {}", model);

        // Touch the counters so the series exist at zero from the first call, giving the alert a
        // baseline instead of no-data until the first failure.
        parseFailureCounter(model, REASON_UNPARSEABLE);
        parseFailureCounter(model, REASON_UNRESOLVABLE_COUNTRY);

        // we need to manually parse the result rather than relying on spring entity mapping
        // because sometimes the llm adds additional text outside the json
        // and spring doesn't strip it automatically
        //
        // The mapper is the tolerant one: it also accepts a bare country name where the schema
        // asks for the full object. The schema handed to the model is unchanged.
        var converter = new BeanOutputConverter<>(LlmCalloutList.class, llmResponseMapper.mapper());

        ChatResponse chatResponse = chatClient.prompt()
                .user(AiPrompts.FIND_NEWS_PROMPT + "\n" + converter.getFormat())
                .options(OpenAiChatOptions.builder()
                        .model(model)
                        .maxTokens(maxTokens))
                .call()
                .chatResponse();

        Instant receivedAt = Instant.now();

        if (chatResponse == null) {
            log.error("Null chatResponse from OpenRouter model {}, skipping", model);
            return Optional.empty();
        }

        // schedule cost collection - the underlying response from OpenRouter has cost details
        // but currently Spring AI doesn't expose it, and it'd be a bit messy to extract
        // by intercepting the underlying OpenAI SDK raw response.
        String id = chatResponse.getMetadata().getId();
        log.info("Scheduling cost metrics collection for {}", id);
        taskScheduler.schedule(() -> recordMetadata(chatResponse.getMetadata(), receivedAt, model), Instant.now().plusSeconds(GENERATION_CALL_DELAY));

        String raw = Optional.ofNullable(chatResponse.getResult())
                .map(r -> r.getOutput().getText())
                .orElse(null);
        if (raw == null) {
            log.error("Got empty result from call to model {}", model);
            return Optional.empty();
        }

        LlmCalloutList result;
        try {
            result = converter.convert(extractJson(raw));
        } catch (Exception e) {
            log.error("Could not parse response from model {}: {}", model, e.getMessage());
            parseFailureCounter(model, REASON_UNPARSEABLE).increment();
            return Optional.empty();
        }

        log.info("Called model {} and received {} callouts", model, result.items().size());

        // A country given as a bare name that isn't in the CSV resolves to null (the file uses
        // e.g. "Palestinian Territory", not "Palestine"). Drop just that callout - losing one of
        // three beats discarding the whole response, which is the failure this guards against.
        List<LlmCallout> usable = result.items().stream()
                .filter(llm -> {
                    if (llm.country() == null) {
                        log.warn("Dropping callout from model {} with unresolvable country: {}", model, llm.headline());
                        return false;
                    }
                    return true;
                })
                .toList();

        // Losing every callout is the same outcome as a parse failure - the source is absent from
        // the map - so fail loudly rather than handing back an empty list, which the pipeline would
        // log as a success and nothing would flag.
        if (usable.isEmpty() && !result.items().isEmpty()) {
            log.error("Every callout from model {} had an unresolvable country, discarding response", model);
            parseFailureCounter(model, REASON_UNRESOLVABLE_COUNTRY).increment();
            return Optional.empty();
        }

        // The model returns the minimal object LlmCallout so it can't try to invent enums.
        // Now map it back to a canonical Callout object.
        return Optional.of(usable.stream()
                .map(llm -> new Callout.Builder(Instant.now())
                        .country(llm.country())
                        .headline(llm.headline())
                        .detail(llm.detail())
                        .extendedDetail(llm.extendedDetail())
                        .type(CalloutType.NEWS)
                        .build())
                .toList());
    }

    private Counter parseFailureCounter(String model, String reason) {
        return meterRegistry.counter(OPENROUTER_GETCALLOUTS_PARSE_FAILURES, "model", model, "reason", reason);
    }

    /**
     * Save relevant metadata, including native call to fetch the cost of an earlier OpenRouter chatResponse
     *
     */
    private void recordMetadata(ChatResponseMetadata chatResponseMetadata, Instant responseReceivedAt, String model) {
        log.info("fetchAndRecordCost {}", chatResponseMetadata.getId());

        Metadata md = new Metadata();
        md.setId(chatResponseMetadata.getId());
        md.setModel(model);
        md.setResponseReceivedAt(responseReceivedAt);

        GenerationResponse response = webClient.get()
                .uri(u -> u.path("/api/v1/generation").queryParam("id", chatResponseMetadata.getId()).build())
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(),
                        resp -> resp.bodyToMono(String.class)
                                .doOnNext(body -> log.error("Cost fetch failed {}: {}", resp.statusCode(), body))
                                .then(Mono.empty()))
                .bodyToMono(GenerationResponse.class)
                .block();

        if (response == null || response.data() == null) {
            log.warn("No cost data received for generation {}", chatResponseMetadata.getId());
        } else {
            log.info("Generation for model {} cost: ${}", model, response.data().totalCost());
            md.setCostUsd(response.data().totalCost());
        }

        metadataRepository.save(md);

    }

    /***
     * Sometimes the model randomly includes some text preamble before the raw json.  Strip this if present.
     *
     * @param raw - raw response from AI model
     * @return json string
     */
    private String extractJson(String raw) {
        String prefix = raw.substring(0, Math.min(raw.length(), 100));
        log.info("Extracting json from: {}", prefix);
        int braceStart = raw.indexOf('{');
        if (braceStart > 0) raw = raw.substring(braceStart);
        int braceEnd = raw.lastIndexOf('}');
        if (braceEnd >= 0 && braceEnd < raw.length() - 1) raw = raw.substring(0, braceEnd + 1);
        return raw.trim();
    }

    @Recover
    public Optional<List<Callout>> getCalloutsRecovery(Exception e) {
        log.error("OpenRouter getCallouts failed after retries exhausted", e);
        meterRegistry.counter(OPENROUTER_GETCALLOUTS_EXHAUSTED).increment();
        return Optional.empty();
    }

    @Recover
    public Optional<StoryOutline> summariseStoriesRecovery(Exception e) {
        log.error("OpenRouter summariseStories failed after retries exhausted", e);
        meterRegistry.counter(OPENROUTER_SUMMARISESTORIES_EXHAUSTED).increment();
        return Optional.empty();
    }
}
