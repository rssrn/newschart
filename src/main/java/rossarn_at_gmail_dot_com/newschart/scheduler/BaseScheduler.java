package rossarn_at_gmail_dot_com.newschart.scheduler;

import rossarn_at_gmail_dot_com.newschart.news.pipeline.GeminiNewsPipelineOrchestrator;
import rossarn_at_gmail_dot_com.newschart.news.pipeline.NYTPipelineOrchestrator;

public abstract class BaseScheduler {

    protected final NYTPipelineOrchestrator nytPipelineOrchestrator;
    protected final GeminiNewsPipelineOrchestrator geminiNewsPipelineOrchestrator;

    protected BaseScheduler(NYTPipelineOrchestrator nytPipelineOrchestrator,
                            GeminiNewsPipelineOrchestrator geminiNewsPipelineOrchestrator) {
        this.nytPipelineOrchestrator = nytPipelineOrchestrator;
        this.geminiNewsPipelineOrchestrator = geminiNewsPipelineOrchestrator;
    }

    public void fetchNewYorkTimes() {
        nytPipelineOrchestrator.executePipeline();
    }

    public void fetchGemini() {
        geminiNewsPipelineOrchestrator.executePipeline();
    }
}
