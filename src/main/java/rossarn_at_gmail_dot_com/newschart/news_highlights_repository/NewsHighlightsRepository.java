package rossarn_at_gmail_dot_com.newschart.news_highlights_repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsHighlightsRepository extends MongoRepository<NewsHighlights, String> {
}
