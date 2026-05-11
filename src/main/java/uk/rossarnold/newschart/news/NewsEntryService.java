package uk.rossarnold.newschart.news;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import uk.rossarnold.newschart.callout.CalloutSource;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;

@Service
public class NewsEntryService {

    private static final Logger log = LogManager.getLogger(NewsEntryService.class);

    private final NewsEntryRepository repository;

    @Autowired
    public NewsEntryService(NewsEntryRepository repository) {
        this.repository = repository;
    }

    public NewsEntry saveNewsEntry(NewsEntry newsRss) {
        log.info("Saving RSS");
        return repository.save(newsRss);
    }

    public Optional<NewsEntry> findRssForTodayWithSource(CalloutSource source) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Instant start = today.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        log.info("Checking start {} end {} source {}", start, end, source);

        return repository.findFirstByFetchTimeBetweenAndSourceOrderByFetchTimeAsc(start, end, source);
    }
}
