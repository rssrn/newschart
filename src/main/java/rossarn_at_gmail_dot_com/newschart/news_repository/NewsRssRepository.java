package rossarn_at_gmail_dot_com.newschart.news_repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsRssRepository extends MongoRepository<NewsRss, String> {
}
