package uk.rossarnold.newschart.ai;

import com.google.genai.errors.ClientException;
import com.google.genai.errors.GenAiIOException;
import com.google.genai.errors.ServerException;
import io.micrometer.core.instrument.MeterRegistry;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import uk.rossarnold.newschart.callout.Callout;
import uk.rossarnold.newschart.callout.CalloutSource;
import uk.rossarnold.newschart.callout.CalloutType;
import uk.rossarnold.newschart.callout.LlmCallout;
import uk.rossarnold.newschart.news.highlights.CountryNews;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class GeminiGatewayService {
    private final ChatClient chatClient;
    private final MeterRegistry meterRegistry;

    private static final Logger log = LogManager.getLogger(GeminiGatewayService.class);

    // workaround so the required return format is unambiguous - bare list can confuse the LLM
    public record LlmCalloutList(List<LlmCallout> items) {
    }

    static final String MAIN_SUMMARY_MODEL = "gemini-2.5-flash-lite";
    static final String FIND_NEWS_MODEL = "gemini-2.5-flash";

    static final String GEMINI_GETCALLOUTS_EXHAUSTED = "gemini.getcallouts.exhausted";
    static final String GEMINI_SUMMARISESTORIES_EXHAUSTED = "gemini.summarisestories.exhausted";


    public GeminiGatewayService(GoogleGenAiChatModel chatModel, MeterRegistry meterRegistry) {
        this.chatClient = ChatClient.create(chatModel);
        this.meterRegistry = meterRegistry;
        meterRegistry.counter(GEMINI_GETCALLOUTS_EXHAUSTED); // pre-register to expose baseline 0 value
        meterRegistry.counter(GEMINI_SUMMARISESTORIES_EXHAUSTED);
    }

    @Retryable(
            retryFor = {
                    GenAiIOException.class, // Network/timeout issues
                    ServerException.class // 500, 502, 503, 504 Server errors
            },
            noRetryFor = {
                    // fail fast on these, no point in retry - caller handles
                    ClientException.class // 400, 401, 403, 404 Client errors
            },
            backoff = @Backoff(delayExpression = "${gemini.retry.delay-ms:30000}", multiplier = 2) // and defaults to 3 attempts
    )
    public Optional<StoryOutline> summariseStories(CountryNews countryNews) {

        String prompt = AiPrompts.buildSummariseStoriesPrompt(countryNews);
        log.info("Calling Gemini to summarise stories");
        log.debug("... with prompt: {}", prompt);

        return Optional.ofNullable(
                chatClient.prompt()
                        .user(prompt)
                        .options(GoogleGenAiChatOptions.builder()
                                .model(MAIN_SUMMARY_MODEL)
                                .googleSearchRetrieval(false)) // We don't want search
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
                    GenAiIOException.class, // Network/timeout issues
                    ServerException.class // 500, 502, 503, 504 Server errors
            },
            noRetryFor = {
                    // fail fast on these, no point in retry - caller handles
                    ClientException.class // 400, 401, 403, 404 Client errors
            },
            backoff = @Backoff(delayExpression = "${gemini.retry.delay-ms:30000}", multiplier = 2) // and defaults to 3 attempts
    )
    public Optional<List<Callout>> getCallouts() {
        LlmCalloutList result = chatClient.prompt()
                .user(AiPrompts.FIND_NEWS_GEMINI)
                .options(GoogleGenAiChatOptions.builder()
                        .model(FIND_NEWS_MODEL)
                        .googleSearchRetrieval(true) // Ground the response with search
                        .temperature(1.0))           // Recommended for search tasks
                .call()
                .entity(LlmCalloutList.class);

        // The model returns the minimal object LlmCallout - restriction is to prevent it inventing enum values.
        // Now map it back to a canonical Callout object.
        return Optional.ofNullable(result)
                .map(LlmCalloutList::items)
                .map(items -> items.stream()
                        .map(llm -> new Callout.Builder(Instant.now())
                                .country(llm.country())
                                .headline(llm.headline())
                                .detail(llm.detail())
                                .extendedDetail(llm.extendedDetail())
                                .type(CalloutType.NEWS)
                                .source(CalloutSource.GOOGLE_GEMINI)
                                .build())
                        .toList());
    }

    @Recover
    public Optional<StoryOutline> summariseStoriesRecovery(Exception e) {
        log.error("Gemini summariseStories failed after retries exhausted", e);
        meterRegistry.counter(GEMINI_SUMMARISESTORIES_EXHAUSTED).increment();
        return Optional.empty();
    }

    @Recover
    public Optional<List<Callout>> getCalloutsRecovery(Exception e) {
        log.error("Gemini getCallouts failed after retries exhausted", e);
        meterRegistry.counter(GEMINI_GETCALLOUTS_EXHAUSTED).increment();
        return Optional.empty();
    }
}
