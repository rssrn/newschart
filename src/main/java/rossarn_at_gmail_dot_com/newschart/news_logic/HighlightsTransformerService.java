package rossarn_at_gmail_dot_com.newschart.news_logic;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import rossarn_at_gmail_dot_com.newschart.ai.GeminiGatewayService;
import rossarn_at_gmail_dot_com.newschart.callout_repository.CalloutSource;
import rossarn_at_gmail_dot_com.newschart.callout_repository.CalloutType;
import rossarn_at_gmail_dot_com.newschart.callout_repository.StoryCallout;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.CountryNews;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsHighlights;
import rossarn_at_gmail_dot_com.newschart.pipeline.PipelineContext;
import rossarn_at_gmail_dot_com.newschart.pipeline.PipelineStep;
import rossarn_at_gmail_dot_com.newschart.view.LatLong;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 *
 */
@Service
public class HighlightsTransformerService implements PipelineStep {

    private final GeminiGatewayService geminiGatewayService;

    private static final Logger log = LogManager.getLogger(HighlightsTransformerService.class);

    @Autowired
    public HighlightsTransformerService(GeminiGatewayService geminiGatewayService) {
        this.geminiGatewayService = geminiGatewayService;
    }

    public List<StoryCallout> toCalloutList(NewsHighlights newsHighlights,
                                            CalloutType type,
                                            CalloutSource source,
                                            Instant createdAt) {
        List<StoryCallout> result = new ArrayList<>();
        for (CountryNews countryNews: newsHighlights.getNewsItemsForCountry()) {

            GeminiGatewayService.StoryOutline outline = geminiGatewayService.summariseStories(countryNews).orElseThrow();

            StoryCallout.Builder builder = new StoryCallout.Builder(createdAt);
            builder.headline(outline.title());
            builder.detail(outline.body());

            LatLong latLong = new LatLong(countryNews.getCountry().getLatitude(), countryNews.getCountry().getLongitude());
            builder.latLong(latLong);

            builder.type(type);
            builder.source(source);
            result.add(builder.build());
        }
        log.info("Transformed to {} callouts", result.size());
        return result;
    }

    @Override
    public PipelineContext execute(PipelineContext context) {
        log.info("Executing transformer in pipeline");

        NewsHighlights newsHighlights = context.getNewsHighlights();
        if (Objects.isNull(newsHighlights)) {
            log.error("Missing required context in {}", this.getClass().getName());
            context.setFailed(true);
            return context;
        }
        context.setCallouts(toCalloutList(
                newsHighlights,
                CalloutType.NEWS,
                context.getNewsRss().getSource(),
                context.getNewsRss().getFetchTime()
                ));
        return context;
    }
}
