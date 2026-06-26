package uk.rossarnold.newschart.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.openai.errors.BadRequestException;
import com.openai.errors.InternalServerException;
import com.openai.errors.OpenAIIoException;
import com.openai.errors.RateLimitException;
import com.openai.errors.UnauthorizedException;
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

    record GenerationResponse(GenerationData data) {
    }

    record GenerationData(@JsonProperty("total_cost") double totalCost) {
    }

    private static final Logger log = LogManager.getLogger(OpenRouterGatewayService.class);

    static final String MAIN_SUMMARY_MODEL = "openai/gpt-oss-120b:free";

    // secondary call to get OpenRouter cost data needs a delay since it doesn't populate immediately
    private static final int GENERATION_CALL_DELAY = 35;

    static final String OPENROUTER_GETCALLOUTS_EXHAUSTED = "gemini.getcallouts.exhausted";
    static final String OPENROUTER_SUMMARISESTORIES_EXHAUSTED = "openrouter.summarisestories.exhausted";

    public OpenRouterGatewayService(OpenAiChatModel chatModel,
                                    MeterRegistry meterRegistry,
                                    ThreadPoolTaskScheduler taskScheduler,
                                    @Qualifier("openRouterWebClient") WebClient webClient,
                                    MetadataRepository metadataRepository) {
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
                                .model(MAIN_SUMMARY_MODEL))
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

        // we need to manually parse the result rather than relying on spring entity mapping
        // because sometimes the llm adds additional text outside the json
        // and spring doesn't strip it automatically
        var converter = new BeanOutputConverter<>(LlmCalloutList.class);

        ChatResponse chatResponse = chatClient.prompt()
                .user(AiPrompts.FIND_NEWS_PROMPT + "\n" + converter.getFormat())
                .options(OpenAiChatOptions.builder()
                        .model(model))
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
            return Optional.empty();
        }

        log.info("Called model {} and received {} callouts", model, result.items().size());

        // The model returns the minimal object LlmCallout so it can't try to invent enums.
        // Now map it back to a canonical Callout object.
        return Optional.of(result.items().stream()
                .map(llm -> new Callout.Builder(Instant.now())
                        .country(llm.country())
                        .headline(llm.headline())
                        .detail(llm.detail())
                        .extendedDetail(llm.extendedDetail())
                        .type(CalloutType.NEWS)
                        .build())
                .toList());
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
