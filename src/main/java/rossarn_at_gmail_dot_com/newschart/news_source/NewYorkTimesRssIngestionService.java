package rossarn_at_gmail_dot_com.newschart.news_source;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsHighlights;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsHighlightsService;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsItem;
import rossarn_at_gmail_dot_com.newschart.news_logic.MostCommonCountryHighlighter;
import rossarn_at_gmail_dot_com.newschart.news_repository.NewsRss;
import rossarn_at_gmail_dot_com.newschart.news_repository.NewsRssService;

import java.util.List;

@Service
public class NewYorkTimesRssIngestionService {
    private static final Logger log = LogManager.getLogger(NewYorkTimesRssIngestionService.class);

    private static final NewsSource sourceName = NewsSource.NEW_YORK_TIMES;

    private static final String URL = "https://rss.nytimes.com/services/xml/rss/nyt/World.xml";

    private WebClient webClient;

    private NewsRssService newsRssService;
    private NewYorkTimesRssParserService parserService;
    private NewsHighlightsService newsHighlightsService;

    @Autowired
    public NewYorkTimesRssIngestionService(
            NewsRssService newsRssService,
            NewYorkTimesRssParserService parserService,
            NewsHighlightsService newsHighlightsService) {
        this.newsRssService = newsRssService;
        this.parserService = parserService;
        this.newsHighlightsService = newsHighlightsService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void applicationReady() {
        log.info("Application ready, fetching RSS");
        initWebClient();
        getRss();
    }

    private void initWebClient() {
        webClient = WebClient.create(URL);
    }

    private void getRss() {
        log.debug("--> getRss");
        String result = "";
        try {
            result = webClient.get().retrieve().bodyToMono(String.class).block();
        } catch (RuntimeException e) {
            log.error("Error when trying to ingest from NYT RSS: {}", e.getMessage());
            // TODO consider retry strategy
        } finally {
            log.info("Retrieved RSS of length: {}", result.length());
            NewsRss newsRss = new NewsRss(result, sourceName);
            handleNewRss(newsRss);
        }
    }

    private void handleNewRss(NewsRss newsRss) {
        // save the raw data
        NewsRss result = newsRssService.saveNewsRss(newsRss);
        log.info("Saved RSS with ID {}", result.getId());

        // parse NYT's RSS structure into our internal representation
        List<NewsItem> newsItems = parserService.getNewsItems(result.getSource(), result.getBlob());

        // produce highlights algorithmically
        NewsHighlights newsHighlights = MostCommonCountryHighlighter.makeHighlights(newsItems);
        newsHighlights.setFetchTime(newsRss.getFetchTime());
        newsHighlights.setSource(newsRss.getSource());

        // save highlights in repository
        newsHighlightsService.saveNewsHighlights(newsHighlights);
    }

}
