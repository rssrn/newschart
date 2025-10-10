package rossarn_at_gmail_dot_com.newschart.news_source;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import rossarn_at_gmail_dot_com.newschart.news_repository.NewsRss;
import rossarn_at_gmail_dot_com.newschart.news_repository.NewsRssService;

@Service
public class NewYorkTimesRssIngestionService {
    private static final Logger log = LogManager.getLogger(NewYorkTimesRssIngestionService.class);

    private static final NewsSource sourceName = NewsSource.NEW_YORK_TIMES;

    private static final String urlString = "https://rss.nytimes.com/services/xml/rss/nyt/World.xml";

    private WebClient webClient;

    @Autowired
    private NewsRssService newsRssService;

    @Autowired
    private NewYorkTimesRssEnricherService enricherService;

    @EventListener(ApplicationReadyEvent.class)
    public void applicationReady() {
        log.info("Application ready, fetching RSS");
        initWebClient();
        getRss();
    }

    private void initWebClient() {
        webClient = WebClient.create(urlString);
    }

    private void getRss() {
        log.debug("--> getRss");
        String result = webClient.get().retrieve().bodyToMono(String.class).block();

        log.info("Retrieved RSS of length:" + result.length());

        NewsRss newsRss = new NewsRss(result, sourceName);

        handleNewRss(newsRss);
    }

    private void handleNewRss(NewsRss newsRss) {
        // save the raw data
        NewsRss result = newsRssService.saveNewsRss(newsRss);
        log.info("Saved RSS with ID " + result.getId());

        // pass to enricher for parsing / saving
        enricherService.process(result);
    }

}
