package uk.rossarnold.newschart.news;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import uk.rossarnold.newschart.callout.CalloutSource;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface NewsEntryRepository extends MongoRepository<NewsEntry, String> {

    Optional<NewsEntry> findFirstByFetchTimeBetweenAndSourceOrderByFetchTimeAsc(
            Instant startTime,
            Instant endTime,
            CalloutSource source
    );
}
