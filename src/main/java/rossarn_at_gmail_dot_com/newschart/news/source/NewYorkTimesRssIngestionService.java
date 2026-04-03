package rossarn_at_gmail_dot_com.newschart.news.source;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import rossarn_at_gmail_dot_com.newschart.callout.CalloutSource;
import rossarn_at_gmail_dot_com.newschart.news.NewsRss;
import rossarn_at_gmail_dot_com.newschart.news.NewsRssService;
import rossarn_at_gmail_dot_com.newschart.news.pipeline.PipelineContext;
import rossarn_at_gmail_dot_com.newschart.news.pipeline.PipelineStep;

import java.util.Objects;
import java.util.Optional;

@Service
public class NewYorkTimesRssIngestionService implements PipelineStep {
    private static final Logger log = LogManager.getLogger(NewYorkTimesRssIngestionService.class);

    private static final CalloutSource source = CalloutSource.NEW_YORK_TIMES;

    private static final String URL = "https://rss.nytimes.com/services/xml/rss/nyt/World.xml";

    private final NewsRssService newsRssService;
    private final Environment environment;

    @Autowired
    public NewYorkTimesRssIngestionService(NewsRssService newsRssService, Environment environment) {
        this.newsRssService = newsRssService;
        this.environment = environment;
    }

    @Override
    public PipelineContext execute(PipelineContext context) {
        log.info("pipeline: execute {}", this.getClass().getName());

        // if we already have the rss for today from this source, return the result from the DB
        Optional<NewsRss> existingRss = newsRssService.findRssForTodayWithSource(source);
        if (existingRss.isPresent()) {
            context.setNewsRss(existingRss.get());
            log.info("Found existing news RSS for today so not hitting external URL, returning from DB instead");
            context.setCalloutSource(source);
            return context;
        } else {
            log.info("Did not find any existing news RSS for today");
        }

        String result;
        try {
            WebClient webClient = WebClient.create(URL);
            result = webClient.get().retrieve().bodyToMono(String.class).block();

            if (Objects.isNull(result)) {
                context.setFailed(true);
                return context;
            }
            log.info("Retrieved RSS of length: {}", result.length());

        } catch (RuntimeException e) {
            log.error("Error when trying to ingest from NYT RSS: {}", e.getMessage());
            // TODO consider retry strategy
            context.setFailed(true);
            return context;
        }

        NewsRss newsRss = new NewsRss(result, source);
        // in prod we don't want to save the (large) raw data
        if (environment.acceptsProfiles(Profiles.of("dev"))) {
            newsRssService.saveNewsRss(newsRss);
        }
        context.setNewsRss(newsRss);
        context.setCalloutSource(newsRss.getSource());

        return context;

    }
}
