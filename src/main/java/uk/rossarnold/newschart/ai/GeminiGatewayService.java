package uk.rossarnold.newschart.ai;

import com.google.genai.errors.ClientException;
import com.google.genai.errors.GenAiIOException;
import com.google.genai.errors.ServerException;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.ai.chat.client.ChatClient;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import uk.rossarnold.newschart.callout.Callout;
import uk.rossarnold.newschart.callout.CalloutSource;
import uk.rossarnold.newschart.callout.CalloutType;
import uk.rossarnold.newschart.callout.LlmCallout;
import uk.rossarnold.newschart.news.highlights.CountryNews;
import uk.rossarnold.newschart.news.highlights.NewsItem;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class GeminiGatewayService {
    private final ChatClient chatClient;
    private final MeterRegistry meterRegistry;

    private static final Logger log = LogManager.getLogger(GeminiGatewayService.class);

    public record StoryOutline(String country, String title, String body, String extendedBody) {
    }

    // workaround so the required return format is unambiguous - bare list can confuse the LLM
    public record LlmCalloutList(List<LlmCallout> items) {}

    static final String MAIN_SUMMARY_PROMPT = """
            Given the following list of news stories, return a summary consisting of one summarised header and
            one summarised body, and a longer extended detail description.  Do not get any input from web sources, only use the given input.  Some
            of the input data may be outliers, so if a small number of input items seem less related to the overall
            theme, they can be ignored.
            Tone of the summary should be factual and concise, suitable for a general-purpose news feed.
            The input data includes a field to indicate the main country of interest for the returned summary.
            The returned title must be 3-7 words.  The returned detail must be 12-20 words.  The returned extended detail can be up to 100 words.
            """;

    static final String MAIN_SUMMARY_MODEL = "gemini-2.5-flash-lite";
    static final String FIND_NEWS_MODEL = "gemini-2.5-flash";

    static final String COUNTER_NAME_EXHAUSTED = "gemini.getcallouts.exhausted";

    public GeminiGatewayService(GoogleGenAiChatModel chatModel, MeterRegistry meterRegistry) {
        this.chatClient = ChatClient.create(chatModel);
        this.meterRegistry = meterRegistry;
        meterRegistry.counter(COUNTER_NAME_EXHAUSTED); // pre-register to expose baseline 0 value
    }

    public Optional<GeminiGatewayService.StoryOutline> summariseStories(CountryNews countryNews) {

        // collate input data for Gemini
        String country = countryNews.getCountry().getName();
        StringBuilder concatTitle = new StringBuilder();
        StringBuilder concatBody = new StringBuilder();
        for (NewsItem newsItem : countryNews.getNewsItems()) {
            concatTitle.append(newsItem.title()).append(".");
            concatBody.append(newsItem.text()).append(".");
        }

        String promptInput = "Country: " + country + "\nTitles: " + concatTitle + "\nContent: " + concatBody;
        String prompt = MAIN_SUMMARY_PROMPT + promptInput;

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
                    // fail fast on these, no point in retry - caller handlesfind
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

        // The model returns the minimal object LlmCallout so it can't try to invent enums.
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
    public Optional<List<Callout>> getCalloutsRecovery(Exception e) {
        log.error("Gemini getCallouts failed after retries exhausted", e);
        meterRegistry.counter(COUNTER_NAME_EXHAUSTED).increment();
        return Optional.empty();
    }
}
