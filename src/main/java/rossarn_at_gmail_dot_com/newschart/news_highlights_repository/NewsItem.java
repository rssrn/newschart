package rossarn_at_gmail_dot_com.newschart.news_highlights_repository;

import rossarn_at_gmail_dot_com.newschart.geo.Country;
import rossarn_at_gmail_dot_com.newschart.news_source.NewsSource;

import java.util.List;

public record NewsItem (NewsSource source, String title, String link, String text, List<Country> countries) {

    public boolean isForCountry(Country c) {
        return countries.contains(c);
    }
}
