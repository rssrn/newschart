package uk.rossarnold.newschart.news.highlights;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import uk.rossarnold.newschart.ai.GeminiGatewayService;
import uk.rossarnold.newschart.callout.CalloutSource;
import uk.rossarnold.newschart.callout.CalloutType;
import uk.rossarnold.newschart.callout.Callout;
import uk.rossarnold.newschart.news.pipeline.PipelineContext;
import uk.rossarnold.newschart.news.pipeline.PipelineStep;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 *
 */
@Service
public class CalloutBuilderService implements PipelineStep {

    private final GeminiGatewayService geminiGatewayService;

    private static final Logger log = LogManager.getLogger(CalloutBuilderService.class);

    @Autowired
    public CalloutBuilderService(GeminiGatewayService geminiGatewayService) {
        this.geminiGatewayService = geminiGatewayService;
    }

    public List<Callout> toCalloutList(NewsHighlights newsHighlights,
                                            CalloutType type,
                                            CalloutSource source,
                                            Instant createdAt) {
        List<Callout> result = new ArrayList<>();
        for (CountryNews countryNews: newsHighlights.getNewsItemsForCountry()) {

            Optional<GeminiGatewayService.StoryOutline> outlineOpt = geminiGatewayService.summariseStories(countryNews);
            if (outlineOpt.isEmpty()) {
                log.warn("Gemini returned empty outline for country: {}", countryNews.getCountry().getName());
                continue;
            }

            Callout.Builder builder = new Callout.Builder(createdAt);
            builder.country(countryNews.getCountry());
            builder.headline(outlineOpt.get().title());
            builder.detail(outlineOpt.get().body());
            builder.extendedDetail(outlineOpt.get().extendedBody());
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
                context.getNewsEntry().getSource(),
                context.getNewsEntry().getFetchTime()
                ));
        return context;
    }
}
