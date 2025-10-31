package rossarn_at_gmail_dot_com.newschart.news_source;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import rossarn_at_gmail_dot_com.newschart.callout_repository.CalloutSource;
import rossarn_at_gmail_dot_com.newschart.news_repository.NewsRss;
import rossarn_at_gmail_dot_com.newschart.news_repository.NewsRssService;
import rossarn_at_gmail_dot_com.newschart.pipeline.PipelineContext;
import rossarn_at_gmail_dot_com.newschart.pipeline.PipelineStep;

import java.util.Objects;
import java.util.Optional;

@Service
public class NewYorkTimesRssIngestionService implements PipelineStep {
    private static final Logger log = LogManager.getLogger(NewYorkTimesRssIngestionService.class);

    private static final CalloutSource source = CalloutSource.NEW_YORK_TIMES;

    private static final String URL = "https://rss.nytimes.com/services/xml/rss/nyt/World.xml";

    private final NewsRssService newsRssService;

    @Autowired
    public NewYorkTimesRssIngestionService(NewsRssService newsRssService) {
        this.newsRssService = newsRssService;
    }

    @Override
    public PipelineContext execute(PipelineContext context) {
        log.info("pipeline: execute {}", this.getClass().getName());

        // if we already have the rss for today from this source, return the result from the DB
        Optional<NewsRss> existingRss = newsRssService.findRssForTodayWithSource(source);
        if (existingRss.isPresent()) {
            context.setNewsRss(existingRss.get());
            log.info("Found existing news RSS for today so not hitting external URL, returning from DB instead");
            return context;
        } else {
            log.info("Did not find any existing news RSS for today");
        }

        String result = "";
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
        newsRssService.saveNewsRss(newsRss);
        context.setNewsRss(newsRss);
        context.setCalloutSource(newsRss.getSource());

        return context;

    }
}
