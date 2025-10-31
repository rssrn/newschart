package rossarn_at_gmail_dot_com.newschart.scheduler;

import rossarn_at_gmail_dot_com.newschart.pipeline.NYTPipelineOrchestrator;

public abstract class SchedulerBase {

    protected final NYTPipelineOrchestrator nytPipelineOrchestrator;

    protected SchedulerBase(NYTPipelineOrchestrator nytPipelineOrchestrator) {
        this.nytPipelineOrchestrator = nytPipelineOrchestrator;
    }

    public void fetchNewYorkTimes() {
        nytPipelineOrchestrator.executePipeline();
    }
}
