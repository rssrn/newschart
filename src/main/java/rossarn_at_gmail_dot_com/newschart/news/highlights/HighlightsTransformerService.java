package rossarn_at_gmail_dot_com.newschart.news.highlights;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import rossarn_at_gmail_dot_com.newschart.ai.GeminiGatewayService;
import rossarn_at_gmail_dot_com.newschart.callout.CalloutSource;
import rossarn_at_gmail_dot_com.newschart.callout.CalloutType;
import rossarn_at_gmail_dot_com.newschart.callout.StoryCallout;
import rossarn_at_gmail_dot_com.newschart.news.highlights.CountryNews;
import rossarn_at_gmail_dot_com.newschart.news.highlights.NewsHighlights;
import rossarn_at_gmail_dot_com.newschart.news.pipeline.PipelineContext;
import rossarn_at_gmail_dot_com.newschart.news.pipeline.PipelineStep;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

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

            Optional<GeminiGatewayService.StoryOutline> outlineOpt = geminiGatewayService.summariseStories(countryNews);
            if (outlineOpt.isEmpty()) {
                log.warn("Gemini returned empty outline for country: {}", countryNews.getCountry().getName());
                continue;
            }

            StoryCallout.Builder builder = new StoryCallout.Builder(createdAt);
            builder.country(countryNews.getCountry());
            builder.headline(outlineOpt.get().title());
            builder.detail(outlineOpt.get().body());
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
