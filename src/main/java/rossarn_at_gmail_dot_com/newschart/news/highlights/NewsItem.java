package rossarn_at_gmail_dot_com.newschart.news.highlights;

import rossarn_at_gmail_dot_com.newschart.callout.CalloutSource;
import rossarn_at_gmail_dot_com.newschart.geo.Country;

import java.util.List;

public record NewsItem (CalloutSource source, String title, String link, String text, List<Country> countries) {

    public boolean isForCountry(Country c) {
        return countries.contains(c);
    }
}
