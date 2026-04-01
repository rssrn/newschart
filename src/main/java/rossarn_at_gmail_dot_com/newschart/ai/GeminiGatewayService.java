package rossarn_at_gmail_dot_com.newschart.ai;

import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.stereotype.Service;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.ParameterizedTypeReference;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import rossarn_at_gmail_dot_com.newschart.callout_repository.StoryCallout;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.CountryNews;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsItem;

import java.util.List;
import java.util.Optional;

@Service
public class GeminiGatewayService {
    private final ChatClient chatClient;

    private static final Logger log = LogManager.getLogger(GeminiGatewayService.class);

    public record StoryOutline(String country, String title, String body) {
    }

    static final String MAIN_SUMMARY_PROMPT = """
            Given the following list of news stories, return a summary consisting of one summarised header and
            one summarised body.  Do not get any input from web sources, only use the given input.  Some
            of the input data may be outliers, so if a small number of input items seem less related to the overall
            theme, they can be ignored.
            Tone of the summary should be factual and concise, suitable for a general-purpose news feed.
            The input data includes a field to indicate the main country of interest for the returned summary.
            The returned title must be 3-7 words.  The returned content must be 12-25 words.
            """;

    static final String FIND_NEWS_PROMPT = """
            Using the Google Search tool, find today's top 3 international news stories.  Do not include sport.
            Focus only on information retrieved from search.
            The returned title must be 8 words or fewer.
            The returned content must be 12-25 words.
            The returned country should be the primary location of the story.
            Return a list of exactly 3 items.
            """;

    static final String MAIN_SUMMARY_MODEL = "gemini-2.5-flash-lite";
    static final String FIND_NEWS_MODEL = "gemini-3.1-flash-lite-preview";

    public GeminiGatewayService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
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

        log.info("Calling Gemini with prompt: {}", prompt);

        return Optional.ofNullable(
                chatClient.prompt()
                        .user(prompt)
                        .options(GoogleGenAiChatOptions.builder()
                                .model(MAIN_SUMMARY_MODEL)
                                .googleSearchRetrieval(false) // We don't want search
                                .build())
                        .call()
                        .entity(StoryOutline.class)
        );
    }

    /**
     * Use LLM to generate top news stories for today.
     *
     * @return list of story callouts suggested by the LLM
     */
    public Optional<List<StoryCallout>> getCallouts() {
        return Optional.ofNullable(
                chatClient.prompt()
                        .user(FIND_NEWS_PROMPT)
                        .options(GoogleGenAiChatOptions.builder()
                                .model(FIND_NEWS_MODEL)
                                .googleSearchRetrieval(true) // Ground the response with search
                                .temperature(1.0)            // Recommended for search tasks
                                .build())
                        .call()
                        .entity(new ParameterizedTypeReference<List<StoryCallout>>() {
                        })
        );
    }
}
