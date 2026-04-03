package rossarn_at_gmail_dot_com.newschart.news.pipeline;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.ArrayList;
import java.util.List;

public class BasePipelineOrchestrator {
    private static final Logger log = LogManager.getLogger(BasePipelineOrchestrator.class);
    protected final List<PipelineStep> pipelineSteps = new ArrayList<>();

    public PipelineContext executePipeline() {
        log.info("Executing pipeline as {}", this.getClass().getSimpleName());

        PipelineContext context = new PipelineContext();
        for (PipelineStep step: pipelineSteps) {
            try {
                context = step.execute(context);
                if (context.isFailed()) {
                    log.error("Pipeline step {} failed, stopping pipeline {}", step.getClass(), this.getClass());
                    break;
                }
            } catch (RuntimeException e) {
                throw new RuntimeException(e);
            }
        }
        log.info("Pipeline completed: {}", this.getClass().getName());
        if (context.isFailed()) {
            log.error(" --> Pipeline failed in one of the steps");
        } else {
            log.info(" --> All steps succeeded");
        }
        return context;
    }

}
