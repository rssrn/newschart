package rossarn_at_gmail_dot_com.newschart.news;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import rossarn_at_gmail_dot_com.newschart.callout.CalloutSource;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface NewsRssRepository extends MongoRepository<NewsRss, String> {

    Optional<NewsRss> findFirstByFetchTimeBetweenAndSourceOrderByFetchTimeAsc(
            Instant startTime,
            Instant endTime,
            CalloutSource source
    );
}
