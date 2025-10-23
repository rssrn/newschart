package rossarn_at_gmail_dot_com.newschart.callout_repository;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import rossarn_at_gmail_dot_com.newschart.pipeline.PipelineContext;
import rossarn_at_gmail_dot_com.newschart.pipeline.PipelineStep;

import java.util.List;
import java.util.Objects;

@Service
public class CalloutService implements PipelineStep {

    private static final Logger log = LogManager.getLogger(CalloutService.class);

    private final CalloutRepository repository;

    @Autowired
    public CalloutService(CalloutRepository repository) {
        this.repository = repository;
    }

    public StoryCallout saveStoryCallout(StoryCallout storyCallout) {
        log.info("Saving StoryCallout");
        return repository.save(storyCallout);
    }

    public List<StoryCallout> getAllCallouts() {
        return repository.findAllDocuments();
    }

    @Override
    public PipelineContext execute(PipelineContext context) {
        List<StoryCallout> callouts = context.getCallouts();
        if (Objects.isNull(callouts)) {
            log.error("Pipeline step missing callouts");
            context.setFailed(true);
            return context;
        }
        repository.saveAll(callouts);
        return context;
    }
}
