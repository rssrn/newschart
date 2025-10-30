package rossarn_at_gmail_dot_com.newschart.news_highlights_repository;

import rossarn_at_gmail_dot_com.newschart.callout_repository.CalloutSource;
import rossarn_at_gmail_dot_com.newschart.geo.Country;

import java.util.List;

public record NewsItem (CalloutSource source, String title, String link, String text, List<Country> countries) {

    public boolean isForCountry(Country c) {
        return countries.contains(c);
    }
}
