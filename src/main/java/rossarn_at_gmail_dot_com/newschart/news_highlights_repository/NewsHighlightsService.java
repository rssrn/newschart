package rossarn_at_gmail_dot_com.newschart.news_highlights_repository;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class NewsHighlightsService {

    private static final Logger log = LogManager.getLogger(NewsHighlightsService.class);

    private final NewsHighlightsRepository repository;

    @Autowired
    public NewsHighlightsService(NewsHighlightsRepository repository) {
        this.repository = repository;
    }

    public NewsHighlights saveNewsHighlights(NewsHighlights newsHighlights) {
        log.info("Saving Highlights");
        return repository.save(newsHighlights);
    }
}
