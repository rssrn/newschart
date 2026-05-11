package uk.rossarnold.newschart.news.source;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;
import uk.rossarnold.newschart.callout.CalloutSource;
import uk.rossarnold.newschart.geo.CountryFactory;
import uk.rossarnold.newschart.news.highlights.NewsItem;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * @author Claude Sonnet 4.6 Anthropic
 */
class NytRssParserServiceTest {

    private NytRssParserService parser;

    // Minimal valid RSS envelope
    private static String rss(String... items) {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.append("<rss version=\"2.0\" xmlns:nyt=\"http://www.nytimes.com/namespaces/keywords\">");
        sb.append("<channel>");
        for (String item : items) {
            sb.append(item);
        }
        sb.append("</channel></rss>");
        return sb.toString();
    }

    private static String item(String title, String link, String description, String... geoTags) {
        StringBuilder sb = new StringBuilder();
        sb.append("<item>");
        sb.append("<title>").append(title).append("</title>");
        sb.append("<link>").append(link).append("</link>");
        sb.append("<description>").append(description).append("</description>");
        for (String geo : geoTags) {
            sb.append("<category domain=\"http://www.nytimes.com/namespaces/keywords/nyt_geo\">")
              .append(geo)
              .append("</category>");
        }
        sb.append("</item>");
        return sb.toString();
    }

    @BeforeEach
    void setUp() throws IOException {
        CountryFactory countryFactory = new CountryFactory(new DefaultResourceLoader());
        countryFactory.init();
        parser = new NytRssParserService(countryFactory);
    }

    @Test
    void parsesBasicFieldsCorrectly() {
        String xml = rss(item("Test Headline", "https://example.com/story", "Story body text"));

        List<NewsItem> items = parser.getNewsItems(CalloutSource.NEW_YORK_TIMES, xml);

        assertEquals(1, items.size());
        NewsItem item = items.get(0);
        assertEquals("Test Headline", item.title());
        assertEquals("https://example.com/story", item.link());
        assertEquals("Story body text", item.text());
        assertEquals(CalloutSource.NEW_YORK_TIMES, item.source());
    }

    @Test
    void geoTagMatchingKnownCountryAttachesCountry() {
        String xml = rss(item("Germany story", "https://example.com", "text", "Germany"));

        List<NewsItem> items = parser.getNewsItems(CalloutSource.NEW_YORK_TIMES, xml);

        assertEquals(1, items.size());
        assertEquals(1, items.get(0).countries().size());
        assertEquals("Germany", items.get(0).countries().get(0).getName());
    }

    @Test
    void geoTagForNonCountryRegionIsIgnored() {
        // NYT geo tags include regions, states, cities — these should not become countries
        String xml = rss(item("Regional story", "https://example.com", "text", "New England"));

        List<NewsItem> items = parser.getNewsItems(CalloutSource.NEW_YORK_TIMES, xml);

        assertEquals(1, items.size());
        assertTrue(items.get(0).countries().isEmpty());
    }

    @Test
    void multipleGeoTagsProduceMultipleCountries() {
        String xml = rss(item("Europe story", "https://example.com", "text", "Germany", "France"));

        List<NewsItem> items = parser.getNewsItems(CalloutSource.NEW_YORK_TIMES, xml);

        assertEquals(1, items.size());
        List<String> names = items.get(0).countries().stream().map(c -> c.getName()).toList();
        assertTrue(names.contains("Germany"));
        assertTrue(names.contains("France"));
    }

    @Test
    void itemWithNoGeoTagsIsIncludedWithEmptyCountries() {
        String xml = rss(item("No geo story", "https://example.com", "text"));

        List<NewsItem> items = parser.getNewsItems(CalloutSource.NEW_YORK_TIMES, xml);

        assertEquals(1, items.size());
        assertTrue(items.get(0).countries().isEmpty());
    }

    @Test
    void multipleItemsAllParsed() {
        String xml = rss(
                item("Story one", "https://example.com/1", "body one", "Germany"),
                item("Story two", "https://example.com/2", "body two", "France"),
                item("Story three", "https://example.com/3", "body three")
        );

        List<NewsItem> items = parser.getNewsItems(CalloutSource.NEW_YORK_TIMES, xml);

        assertEquals(3, items.size());
    }

    @Test
    void malformedXmlReturnsEmptyList() {
        List<NewsItem> items = parser.getNewsItems(CalloutSource.NEW_YORK_TIMES, "this is not xml <<!!>>");

        assertNotNull(items);
        assertTrue(items.isEmpty());
    }

    @Test
    void emptyChannelReturnsEmptyList() {
        String xml = rss(); // no items

        List<NewsItem> items = parser.getNewsItems(CalloutSource.NEW_YORK_TIMES, xml);

        assertNotNull(items);
        assertTrue(items.isEmpty());
    }
}