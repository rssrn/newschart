package uk.rossarnold.newschart.ai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.DefaultResourceLoader;
import uk.rossarnold.newschart.callout.CalloutSource;
import uk.rossarnold.newschart.geo.Country;
import uk.rossarnold.newschart.geo.CountryFactory;
import uk.rossarnold.newschart.news.highlights.CountryNews;
import uk.rossarnold.newschart.news.highlights.NewsItem;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class AiSummaryServiceTest {

    @InjectMocks
    private AiSummaryService aiSummaryService;

    @Mock
    @SuppressWarnings("unused") // injected into aiSummaryService via @InjectMocks
    private GeminiGatewayService geminiGatewayService;
    @Mock
    @SuppressWarnings("unused") // injected into aiSummaryService via @InjectMocks
    private OpenRouterGatewayService openRouterGatewayService;


    @InjectMocks
    private CountryFactory countryFactory;

    @BeforeEach
    void setUp() throws IOException {
        countryFactory = new CountryFactory(new DefaultResourceLoader());
        countryFactory.init();
    }

    @Test
    void BuildConcatSummarySummarisesFullyPopulatedCountryNews() {
        Country uk = countryFactory.getCountry("United Kingdom");
        List<NewsItem> newsItemList = new ArrayList<>();
        StringBuilder expectedExtendedBody = new StringBuilder();
        for (int i = 0; i < 5; ++i) {
            String title = "TITLE_" + i;
            newsItemList.add(new NewsItem(CalloutSource.NEW_YORK_TIMES, title, "", "", List.of(uk)));
            if (i != 0) expectedExtendedBody.append(" / ");
            expectedExtendedBody.append(title);
        }
        CountryNews countryNews = new CountryNews(uk, newsItemList);

        Optional<StoryOutline> storyOutlineOptional = aiSummaryService.summariseStories(countryNews);

        assertTrue(storyOutlineOptional.isPresent());
        assertEquals("News from United Kingdom", storyOutlineOptional.get().title());
        assertEquals("TITLE_0", storyOutlineOptional.get().body());
        assertEquals(expectedExtendedBody.toString(), storyOutlineOptional.get().extendedBody());

    }

}