package rossarn_at_gmail_dot_com.newschart.news_repository;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
}
