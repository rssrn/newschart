package rossarn_at_gmail_dot_com.newschart.news_logic;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import rossarn_at_gmail_dot_com.newschart.callout_repository.CalloutSource;
import rossarn_at_gmail_dot_com.newschart.callout_repository.CalloutType;
import rossarn_at_gmail_dot_com.newschart.callout_repository.StoryCallout;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.CountryNews;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsHighlights;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsItem;
import rossarn_at_gmail_dot_com.newschart.pipeline.PipelineContext;
import rossarn_at_gmail_dot_com.newschart.pipeline.PipelineStep;
import rossarn_at_gmail_dot_com.newschart.view.LatLong;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 *
 */
@Service
public class HighlightsTransformerService implements PipelineStep {

    private static final Logger log = LogManager.getLogger(HighlightsTransformerService.class);

    public List<StoryCallout> toCalloutList(NewsHighlights newsHighlights,
                                            CalloutType type,
                                            CalloutSource source,
                                            Instant createdAt) {
        List<StoryCallout> result = new ArrayList<>();
        for (CountryNews countryNews: newsHighlights.getNewsItemsForCountry()) {

            // TODO - this is a placeholder, we just use the first story in the list.
            // Really we want to call an AI service to summarise the title and text.
            NewsItem firstNewsItem = countryNews.getNewsItems().getFirst();
            String headline = Stream.of(firstNewsItem.title().split("\\s+")).
                    limit(5).
                    collect(Collectors.joining(" "));
            String detail = firstNewsItem.text();
            LatLong latLong = new LatLong(countryNews.getCountry().getLatitude(), countryNews.getCountry().getLongitude());

            StoryCallout.Builder builder = new StoryCallout.Builder(createdAt);
            builder.headline(headline);
            builder.detail(detail);
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
