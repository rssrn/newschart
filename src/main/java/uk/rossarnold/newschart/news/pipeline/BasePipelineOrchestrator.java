package uk.rossarnold.newschart.news.pipeline;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.ArrayList;
import java.util.List;

public class BasePipelineOrchestrator {
    private static final Logger log = LogManager.getLogger(BasePipelineOrchestrator.class);
    protected final List<PipelineStep> pipelineSteps = new ArrayList<>();

    public PipelineContext executePipeline(PipelineContext context) {
        log.info("Executing pipeline as {}", this.getClass().getSimpleName());

        for (PipelineStep step: pipelineSteps) {
            context = step.execute(context);
            if (context.isFailed()) {
                log.error("Pipeline step {} failed, stopping pipeline {}", step.getClass(), this.getClass());
                break;
            }
            if (context.isSkipped()) {
                log.info("Pipeline step {} skipped, stopping pipeline {}", step.getClass(), this.getClass());
                break;
            }
        }
        log.info("Pipeline completed: {}", this.getClass().getName());
        if (context.isFailed() || context.isSkipped()) {
            log.error(" --> Pipeline incomplete: failed or skipped in one of the steps");
        } else {
            log.info(" --> All steps succeeded for {}", context.getCalloutSource());
        }
        return context;
    }

}
