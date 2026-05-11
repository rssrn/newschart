package uk.rossarnold.newschart.news.highlights;

import uk.rossarnold.newschart.callout.CalloutSource;
import uk.rossarnold.newschart.geo.Country;

import java.util.List;

public record NewsItem (CalloutSource source, String title, String link, String text, List<Country> countries) {

    public boolean isForCountry(Country c) {
        return countries.contains(c);
    }
}
