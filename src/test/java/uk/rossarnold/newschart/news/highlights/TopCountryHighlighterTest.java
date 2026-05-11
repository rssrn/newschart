package uk.rossarnold.newschart.news.highlights;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import uk.rossarnold.newschart.callout.CalloutSource;
import uk.rossarnold.newschart.geo.Country;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * @author Claude Sonnet 4.6 Anthropic
 */
class TopCountryHighlighterTest {

    private TopCountryHighlighter highlighter;

    private static Country country(String name) {
        Country c = new Country();
        c.setName(name);
        return c;
    }

    private static NewsItem item(String title, Country... countries) {
        return new NewsItem(CalloutSource.NEW_YORK_TIMES, title, "", "", List.of(countries));
    }

    @BeforeEach
    void setUp() {
        highlighter = new TopCountryHighlighter();
    }

    @Test
    void returnsTopThreeCountriesByFrequency() {
        Country us = country("United States");
        Country uk = country("United Kingdom");
        Country de = country("Germany");
        Country fr = country("France");

        List<NewsItem> items = List.of(
                item("US story 1", us),
                item("US story 2", us),
                item("US story 3", us),
                item("UK story 1", uk),
                item("UK story 2", uk),
                item("DE story 1", de),
                item("FR story 1", fr)
        );

        NewsHighlights result = highlighter.makeHighlights(items);
        List<CountryNews> top = result.getNewsItemsForCountry();

        assertEquals(3, top.size());
        assertEquals(us, top.get(0).getCountry());
        assertEquals(uk, top.get(1).getCountry());
        // de and fr are tied at 1; either may appear third
        assertTrue(List.of(de, fr).contains(top.get(2).getCountry()));
    }

    @Test
    void newsItemsForCountryContainOnlyRelevantItems() {
        Country us = country("United States");
        Country uk = country("United Kingdom");

        NewsItem usItem = item("US story", us);
        NewsItem ukItem = item("UK story", uk);
        NewsItem bothItem = item("Transatlantic story", us, uk);

        NewsHighlights result = highlighter.makeHighlights(List.of(usItem, ukItem, bothItem));
        List<CountryNews> top = result.getNewsItemsForCountry();

        CountryNews usNews = top.stream().filter(cn -> cn.getCountry().equals(us)).findFirst().orElseThrow();
        assertTrue(usNews.getNewsItems().contains(usItem));
        assertTrue(usNews.getNewsItems().contains(bothItem));
        assertFalse(usNews.getNewsItems().contains(ukItem));
    }

    @Test
    void multiCountryItemCountsTowardEachCountry() {
        Country us = country("United States");
        Country uk = country("United Kingdom");

        // uk appears in 2 items via the shared story; us appears in 1
        NewsItem shared1 = item("Story A", us, uk);
        NewsItem shared2 = item("Story B", uk);

        NewsHighlights result = highlighter.makeHighlights(List.of(shared1, shared2));
        List<CountryNews> top = result.getNewsItemsForCountry();

        assertEquals(uk, top.get(0).getCountry(), "UK should rank first with count 2");
        assertEquals(us, top.get(1).getCountry());
    }

    @Test
    void fewerThanThreeCountriesReturnsAll() {
        Country us = country("United States");
        Country uk = country("United Kingdom");

        NewsHighlights result = highlighter.makeHighlights(List.of(item("Story", us), item("Story 2", uk)));

        assertEquals(2, result.getNewsItemsForCountry().size());
    }

    @Test
    void emptyInputReturnsEmptyHighlights() {
        NewsHighlights result = highlighter.makeHighlights(List.of());

        assertNotNull(result);
        assertTrue(result.getNewsItemsForCountry().isEmpty());
    }

    @Test
    void capIsThreeEvenWithManyCountries() {
        List<NewsItem> items = List.of(
                item("1", country("A")),
                item("2", country("B")),
                item("3", country("C")),
                item("4", country("D")),
                item("5", country("E"))
        );

        NewsHighlights result = highlighter.makeHighlights(items);

        assertEquals(3, result.getNewsItemsForCountry().size());
    }
}
