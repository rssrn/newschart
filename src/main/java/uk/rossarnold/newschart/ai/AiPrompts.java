package uk.rossarnold.newschart.ai;

import org.jspecify.annotations.NonNull;
import uk.rossarnold.newschart.news.highlights.CountryNews;
import uk.rossarnold.newschart.news.highlights.NewsItem;

public class AiPrompts {
    static final String MAIN_SUMMARY_PROMPT = """
            Given the following list of news stories, return a summary consisting of one summarised header and
            one summarised body, and a longer extended detail description.  Do not get any input from web sources, only use the given input.  Some
            of the input data may be outliers, so if a small number of input items seem less related to the overall
            theme, they can be ignored.
            Tone of the summary should be factual and concise, suitable for a general-purpose news feed.
            The input data includes a field to indicate the main country of interest for the returned summary.
            The returned title must be 3-7 words.  The returned detail must be 12-20 words.  The returned extended detail can be up to 100 words.
            """;

    static final String FIND_NEWS_PROMPT = """
            Find today's top 3 international news stories.  Do not include sport.
            Prioritise stories by their global significance and consequences, and
            actively counter regional or media bias.
            Use search results as the source of new stories, not your training data.
            Apply your own judgment for editorial decisions such as global significance,
            prioritisation, and summarising the story.
            The returned title must be 8 words or fewer.
            The returned detail must be 12-20 words.
            The returned extended detail can be up to 100 words.
            The returned country should be the primary location of the story.
            Return a list of exactly 3 items.
            """;

    // Ensure Gemini uses its search tool
    static final String FIND_NEWS_GEMINI = "Use the Google Search tool.  " + FIND_NEWS_PROMPT;

    static @NonNull String buildSummariseStoriesPrompt(CountryNews countryNews) {
        // collate input data for the model
        String country = countryNews.getCountry().getName();
        StringBuilder concatTitle = new StringBuilder();
        StringBuilder concatBody = new StringBuilder();
        for (NewsItem newsItem : countryNews.getNewsItems()) {
            concatTitle.append(newsItem.title()).append(".");
            concatBody.append(newsItem.text()).append(".");
        }

        String promptInput = "Country: " + country + "\nTitles: " + concatTitle + "\nContent: " + concatBody;
        return MAIN_SUMMARY_PROMPT + promptInput;
    }

    private AiPrompts() {
    }
}
