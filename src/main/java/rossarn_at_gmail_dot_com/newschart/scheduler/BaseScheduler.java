package rossarn_at_gmail_dot_com.newschart.scheduler;

import rossarn_at_gmail_dot_com.newschart.news.pipeline.GeminiPipelineOrchestrator;
import rossarn_at_gmail_dot_com.newschart.news.pipeline.NytPipelineOrchestrator;

public abstract class BaseScheduler {

    protected final NytPipelineOrchestrator nytPipelineOrchestrator;
    protected final GeminiPipelineOrchestrator geminiNewsPipelineOrchestrator;

    protected BaseScheduler(NytPipelineOrchestrator nytPipelineOrchestrator,
                            GeminiPipelineOrchestrator geminiNewsPipelineOrchestrator) {
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
