package rossarn_at_gmail_dot_com.newschart.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.GenerateContentResponseUsageMetadata;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.CountryNews;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsItem;

import java.util.Objects;
import java.util.Optional;

@Service
public class GeminiGatewayService {

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
            Respond in a json format conforming exactly to this sample.
            Here is the sample response:
            { "country": "country name here", "title": "header data here", "body": "body data here"}
            Here is the input data:
            """;

    public Optional<GeminiGatewayService.StoryOutline> summariseStories(CountryNews countryNews) {

        String country = countryNews.getCountry().getName();
        StringBuilder concatTitle = new StringBuilder();
        StringBuilder concatBody = new StringBuilder();
        for (NewsItem newsItem : countryNews.getNewsItems()) {
            concatTitle.append(newsItem.title()).append(".");
            concatBody.append(newsItem.text()).append(".");
        }
        StoryOutline outline = new StoryOutline(country, concatTitle.toString(), concatBody.toString());

        ObjectMapper mapper = new ObjectMapper();
        String jsonOutline;
        try {
            jsonOutline = mapper.writeValueAsString(outline);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return Optional.empty();
        }

        String prompt = MAIN_SUMMARY_PROMPT + jsonOutline;

        log.info("Calling Gemini with prompt: {}", prompt);

        Optional<StoryOutline> result = Optional.empty();
        try (Client client = new Client()) {
            GenerateContentResponse response = client.models.generateContent(
                    "gemini-2.5-flash-lite",
                    prompt,
                    null);

            if (log.isInfoEnabled()) {
                log.info("Gemini response: {}", response.text());
            }
            logResponseMetadata(response);


            // gemini insists on not returning plain json, so some workaround string replacements here
            StoryOutline summary = mapper.readValue(
                    Objects.requireNonNull(response.text()).replace("```json", "").replace("```", ""),
                    StoryOutline.class);
            result = Optional.of(summary);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }

    private static void logResponseMetadata(GenerateContentResponse response) {
        GenerateContentResponseUsageMetadata metadata = response.usageMetadata().orElseThrow();
        log.info("prompt tokens: {} total tokens: {}", metadata.promptTokenCount(), metadata.totalTokenCount());
    }

}
