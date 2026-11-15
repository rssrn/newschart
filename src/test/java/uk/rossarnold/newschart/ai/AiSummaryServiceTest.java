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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiSummaryServiceTest {

    private AiSummaryService aiSummaryService;

    @Mock
    private GeminiGatewayService geminiGatewayService;
    @Mock
    private OpenRouterGatewayService openRouterGatewayService;

    private GeminiRouteConfig routeConfig;


    @InjectMocks
    private CountryFactory countryFactory;

    @BeforeEach
    void setUp() throws IOException {
        countryFactory = new CountryFactory(new DefaultResourceLoader());
        countryFactory.init();
        routeConfig = new GeminiRouteConfig();
        aiSummaryService = new AiSummaryService(geminiGatewayService, openRouterGatewayService, routeConfig);
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

    // === Gemini route ===

    /** @author Claude Opus 5.5 Anthropic */
    private CountryNews ukNews() {
        Country uk = countryFactory.getCountry("United Kingdom");
        return new CountryNews(uk, List.of(new NewsItem(CalloutSource.NEW_YORK_TIMES, "TITLE", "", "", List.of(uk))));
    }

    /** @author Claude Opus 5.5 Anthropic */
    @Test
    void openRouterRouteSummarisesWithGeminiModelViaOpenRouter() {
        routeConfig.setRoute(GeminiRouteConfig.Route.OPENROUTER);
        CountryNews news = ukNews();
        StoryOutline outline = new StoryOutline("United Kingdom", "T", "B", "E");
        when(openRouterGatewayService.summariseStories(news, routeConfig.getOpenrouterSummaryModel()))
                .thenReturn(Optional.of(outline));

        assertEquals(Optional.of(outline), aiSummaryService.summariseStories(news));
        verifyNoInteractions(geminiGatewayService);
    }

    /** @author Claude Opus 5.5 Anthropic */
    @Test
    void directRouteSummarisesWithGeminiDirectly() {
        routeConfig.setRoute(GeminiRouteConfig.Route.DIRECT);
        CountryNews news = ukNews();
        StoryOutline outline = new StoryOutline("United Kingdom", "T", "B", "E");
        when(geminiGatewayService.summariseStories(news)).thenReturn(Optional.of(outline));

        assertEquals(Optional.of(outline), aiSummaryService.summariseStories(news));
        verifyNoInteractions(openRouterGatewayService);
    }

    /** @author Claude Opus 5.5 Anthropic */
    @Test
    void openRouterRouteFallsBackToMainSummaryModelThenConcat() {
        routeConfig.setRoute(GeminiRouteConfig.Route.OPENROUTER);
        CountryNews news = ukNews();
        when(openRouterGatewayService.summariseStories(any(), anyString())).thenReturn(Optional.empty());

        Optional<StoryOutline> result = aiSummaryService.summariseStories(news);

        verify(openRouterGatewayService).summariseStories(news, routeConfig.getOpenrouterSummaryModel());
        verify(openRouterGatewayService).summariseStories(news, OpenRouterGatewayService.MAIN_SUMMARY_MODEL);
        assertEquals("News from United Kingdom", result.orElseThrow().title());
    }
}
