package rossarn_at_gmail_dot_com.newschart.ai;

import org.springframework.stereotype.Service;
import org.springframework.ai.chat.client.ChatClient;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.CountryNews;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsItem;

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
            Find today's top 3 international news stories.  The returned title must be 8 words or fewer.
            The returned content must be 12-25 words.  The returned country should be the primary location of the story.
            The response must be a json list of 3 news story objects.
            """;

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
                        .call()
                        .entity(StoryOutline.class)
        );
    }
}
