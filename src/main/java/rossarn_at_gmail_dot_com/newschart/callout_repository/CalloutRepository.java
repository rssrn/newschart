package rossarn_at_gmail_dot_com.newschart.callout_repository;

import okhttp3.Call;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalloutRepository extends MongoRepository<StoryCallout, String> {

    List<StoryCallout> findByGeneratedAtBetweenAndSource(Date start, Date end, CalloutSource source);

    Optional<StoryCallout> findFirstByGeneratedAtBetweenAndSourceOrderByGeneratedAtAsc(Instant start, Instant end, CalloutSource source);
}
