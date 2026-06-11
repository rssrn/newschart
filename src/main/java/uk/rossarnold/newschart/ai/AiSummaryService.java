package uk.rossarnold.newschart.ai;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.util.Strings;
import org.springframework.stereotype.Service;
import uk.rossarnold.newschart.news.highlights.CountryNews;
import uk.rossarnold.newschart.news.highlights.NewsItem;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AiSummaryService {

    private static final Logger log = LogManager.getLogger(AiSummaryService.class);

    private final GeminiGatewayService geminiGatewayService;
    private final OpenRouterGatewayService openRouterGatewayService;

    enum SummaryProvider {GEMINI, OPENROUTER, CONCAT}

    private final List<SummaryProvider> fallbackOrder = List.of(
            SummaryProvider.GEMINI,
            SummaryProvider.OPENROUTER,
            SummaryProvider.CONCAT    // if above 2 providers fail, fall back to algorithmic summary
            );

    private static final int NUM_CONCAT_ITEMS = 5;

    public AiSummaryService(GeminiGatewayService geminiGatewayService, OpenRouterGatewayService openRouterGatewayService) {
        this.geminiGatewayService = geminiGatewayService;
        this.openRouterGatewayService = openRouterGatewayService;
    }

    public Optional<StoryOutline> summariseStories(CountryNews countryNews) {
        Optional<StoryOutline> response = Optional.empty();
        int count = 0;
        for (SummaryProvider sp : fallbackOrder) {
            if (count == 0) {
                log.info("Attempting {}", sp);
            } else {
                log.info("Fallback {}: attempting {}", count, sp);
            }
            switch (sp) {
                case GEMINI -> {
                    try {
                        response = geminiGatewayService.summariseStories(countryNews);
                    } catch (Exception e) {
                        log.error("Unexpected exception from gemini summarise", e);
                        // fall through to next in fallback order
                    }
                }
                case OPENROUTER -> {
                    try {
                        response = openRouterGatewayService.summariseStories(countryNews);
                    } catch (Exception e) {
                        log.error("Unexpected exception from openrouter summarise", e);
                        // fall through to next in fallback order
                    }
                }
                case CONCAT ->
                    response = Optional.of(buildConcatSummary(countryNews));
            }
            if (response.isPresent()) {
                return response;
            }
            count++;
        }
        log.info("Unable to summarise stories, all fallback options exhausted, returning empty");
        return Optional.empty();
    }

    /**
     * Fallback to summarising stories algorithmically - just concat the first n headlines.
     *
     * @return list of story callouts suggested by the LLM
     */
    private StoryOutline buildConcatSummary(CountryNews countryNews) {
        String body = Strings.EMPTY;
        String extendedBody = Strings.EMPTY;

        if (!countryNews.getNewsItems().isEmpty()) {
            body = countryNews.getNewsItems().getFirst().title();

            extendedBody = countryNews.getNewsItems().stream()
                    .limit(NUM_CONCAT_ITEMS)
                    .map(NewsItem::title)
                    .collect(Collectors.joining(" / "));
        }

        return new StoryOutline(countryNews.getCountry().getName(), "News from " + countryNews.getCountry().getName(), body, extendedBody);
    }

}
