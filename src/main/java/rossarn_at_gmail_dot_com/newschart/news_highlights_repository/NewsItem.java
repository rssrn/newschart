package rossarn_at_gmail_dot_com.newschart.news_highlights_repository;

import java.util.List;

public record NewsItem (String title, String link, String text, List<String> countries) {
}
