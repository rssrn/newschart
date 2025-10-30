package rossarn_at_gmail_dot_com.newschart.callout_repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface CalloutRepository extends MongoRepository<StoryCallout, String> {

    @Query("{}")
    List<StoryCallout> findAllDocuments();

    List<StoryCallout> findByGeneratedAtBetween(Date start, Date end);
}
