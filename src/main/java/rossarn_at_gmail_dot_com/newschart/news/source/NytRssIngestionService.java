package rossarn_at_gmail_dot_com.newschart.news.source;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

import rossarn_at_gmail_dot_com.newschart.callout.CalloutSource;
import rossarn_at_gmail_dot_com.newschart.news.NewsEntry;
import rossarn_at_gmail_dot_com.newschart.news.NewsEntryService;
import rossarn_at_gmail_dot_com.newschart.news.pipeline.PipelineContext;
import rossarn_at_gmail_dot_com.newschart.news.pipeline.PipelineStep;

import java.util.Optional;

@Service
public class NytRssIngestionService implements PipelineStep {
    private static final Logger log = LogManager.getLogger(NytRssIngestionService.class);

    private static final CalloutSource source = CalloutSource.NEW_YORK_TIMES;

    private final NewsEntryService newsRssService;
    private final Environment environment;
    private final NytRssClient nytRssClient;

    @Autowired
    public NytRssIngestionService(NewsEntryService newsRssService, Environment environment, NytRssClient nytRssClient) {
        this.newsRssService = newsRssService;
        this.environment = environment;
        this.nytRssClient = nytRssClient;
    }

    @Override
    public PipelineContext execute(PipelineContext context) {
        log.info("pipeline: execute {}", this.getClass().getName());

        // if we already have the rss for today from this source, return the result from the DB
        Optional<NewsEntry> existingRss = newsRssService.findRssForTodayWithSource(source);
        if (existingRss.isPresent()) {
            context.setNewsEntry(existingRss.get());
            log.info("Found existing news RSS for today so not hitting external URL, returning from DB instead");
            context.setCalloutSource(source);
            return context;
        } else {
            log.info("Did not find any existing news RSS for today");
        }

        String result;
        try {
            result = nytRssClient.fetchRss(); // Retryable
        } catch (RuntimeException e) {
            // Retries exhausted
            log.error("Error when trying to ingest from NYT RSS: {}", e.getMessage());
            context.setFailed(true);
            return context;
        }

        NewsEntry newsRss = new NewsEntry(result, source);
        // in prod we don't want to save the (large) raw data
        if (environment.acceptsProfiles(Profiles.of("dev"))) {
            newsRssService.saveNewsEntry(newsRss);
        }
        context.setNewsEntry(newsRss);
        context.setCalloutSource(newsRss.getSource());

        return context;

    }
}
