package rossarn_at_gmail_dot_com.newschart.ai;

public class AiPrompts {
    private AiPrompts() {}

    static final String FIND_NEWS_PROMPT = """
            Find today's top 3 international news stories.  Do not include sport.
            Prioritise stories by their global significance and consequences, not by the prominence of the affected country in Western media.
            Use search results as the source of new stories, not your training data.
            Apply your own judgment for editorial decisions such as global significance,
            prioritisation, and summarising the story.
            The returned title must be 8 words or fewer.
            The returned detail must be 12-20 words.
            The returned extended detail can be up to 100 words.
            The returned country should be the primary location of the story.
            Return a list of exactly 3 items.
            """;

    // Ensure Gemini uses the search tool
    static final String FIND_NEWS_GEMINI = "Use the Google Search tool.  " + FIND_NEWS_PROMPT;
}
