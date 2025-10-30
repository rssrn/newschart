package rossarn_at_gmail_dot_com.newschart.news_repository;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import rossarn_at_gmail_dot_com.newschart.callout_repository.CalloutSource;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;

@Service
public class NewsRssService {

    private static final Logger log = LogManager.getLogger(NewsRssService.class);

    private final NewsRssRepository repository;

    @Autowired
    public NewsRssService(NewsRssRepository repository) {
        this.repository = repository;
    }

    public NewsRss saveNewsRss(NewsRss newsRss) {
        log.info("Saving RSS");
        return repository.save(newsRss);
    }

    public Optional<NewsRss> findRssForTodayWithSource(CalloutSource source) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Instant start = today.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        log.info("Checking start {} end {} source {}", start, end, source);

        return repository.findFirstByFetchTimeBetweenAndSourceOrderByFetchTimeAsc(start, end, source);
    }
}
