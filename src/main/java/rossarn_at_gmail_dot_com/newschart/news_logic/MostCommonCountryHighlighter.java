package rossarn_at_gmail_dot_com.newschart.news_logic;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import rossarn_at_gmail_dot_com.newschart.geo.Country;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.CountryNews;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsHighlights;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsItem;

import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 *
 */
public class MostCommonCountryHighlighter {

    private static final Logger log = LogManager.getLogger(MostCommonCountryHighlighter.class);

    private MostCommonCountryHighlighter() {
        throw new IllegalStateException("Utility class");
    }

    /**
     * The strategy here is to filter news for the most frequently appearing countries.
     * It's purely a counting exercise, there is no qualitative assessment.
     * The news items returned may relate to multiple different happenings related to that country.
     *
     * @param newsItems - full list of news items to process
     * @return NewsHighlights - top X countries mentioned in newsItems, and list of news items for each of those countries
     */
    public static NewsHighlights makeHighlights(List<NewsItem> newsItems) {

        // First iterate to get the counts per country
        Map<Country, Integer> tally = new HashMap<>();
        for (NewsItem newsItem : newsItems) {
            for (Country country : newsItem.countries()) {
                tally.compute(country, (k, v) -> (v == null) ? 1 : v + 1);
            }
        }

        // sort to find the top X countries in the news
        Map<Country, Integer> sortedTally = tally.entrySet().stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, LinkedHashMap::new));

        // iterate top X tagged countries to build our response
        List<CountryNews> topNews = new LinkedList<>();
        int count = 0;
        for (Map.Entry<Country, Integer> entry : sortedTally.entrySet()) {

            Country thisCountry = entry.getKey();

            List<NewsItem> itemsForCountry = newsItems.stream()
                    .filter(c -> c.countries().contains(thisCountry))
                    .toList();

            CountryNews countryNews = new CountryNews(thisCountry, itemsForCountry);
            topNews.add(countryNews);

            log.info("Top {}: {} with count {} has {} news items", count, entry.getKey(), entry.getValue(), itemsForCountry.size());
            if (++count >= 3) {
                break;
            }
        }

        return new NewsHighlights(topNews);
    }
}
