package rossarn_at_gmail_dot_com.newschart.news.highlights;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import rossarn_at_gmail_dot_com.newschart.news.pipeline.PipelineContext;
import rossarn_at_gmail_dot_com.newschart.news.pipeline.PipelineStep;

import java.util.Objects;

@Service
public class NewsHighlightsService implements PipelineStep {

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

    @Override
    public PipelineContext execute(PipelineContext context) {
        NewsHighlights newsHighlights = context.getNewsHighlights();
        if (Objects.isNull(newsHighlights)) {
            log.error("Pipeline step missing NewsHighlights");
            context.setFailed(true);
            return context;
        }
        NewsHighlights result = saveNewsHighlights(newsHighlights);
        if (Objects.isNull(result.getId())) {
            log.error("Failed to save NewsHighlights");
            context.setFailed(true);
            return context;
        }
        context.setNewsHighlights(result);
        return context;
    }
}
