package uk.rossarnold.newschart.scheduler;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import uk.rossarnold.newschart.news.pipeline.GeminiPipelineOrchestrator;
import uk.rossarnold.newschart.news.pipeline.NytPipelineOrchestrator;
import uk.rossarnold.newschart.news.pipeline.OpenRouterPipelineOrchestrator;
import uk.rossarnold.newschart.news.pipeline.PipelineContext;

public abstract class BaseScheduler {

    private static final Logger log = LogManager.getLogger(BaseScheduler.class);

    protected final NytPipelineOrchestrator nytPipelineOrchestrator;
    protected final GeminiPipelineOrchestrator geminiNewsPipelineOrchestrator;
    protected final OpenRouterPipelineOrchestrator openRouterPipelineOrchestrator;

    protected BaseScheduler(NytPipelineOrchestrator nytPipelineOrchestrator,
                            GeminiPipelineOrchestrator geminiNewsPipelineOrchestrator,
                            OpenRouterPipelineOrchestrator openRouterPipelineOrchestrator) {
        this.nytPipelineOrchestrator = nytPipelineOrchestrator;
        this.geminiNewsPipelineOrchestrator = geminiNewsPipelineOrchestrator;
        this.openRouterPipelineOrchestrator = openRouterPipelineOrchestrator;
    }

    public void fetchNewYorkTimes() {
        var finalContext = nytPipelineOrchestrator.executePipeline();
        if (finalContext.isFailed()) {
            log.error("Failure in scheduled NYT pipeline execution");
        }
    }

    public void fetchGemini() {
        var finalContext = geminiNewsPipelineOrchestrator.executePipeline();
        if (finalContext.isFailed()) {
            log.error("Failure in scheduled Gemini pipeline execution");
        }
    }

    public void fetchOpenRouter(BasicFetchSchedulerConfig.OpenRouterConfig openRouterConfig) {
        PipelineContext context = new PipelineContext();
        context.setModel(openRouterConfig.model());
        context.setCalloutSource(openRouterConfig.source());

        var finalContext = openRouterPipelineOrchestrator.executePipeline(context);
        if (finalContext.isFailed()) {
            log.error("Failure in scheduled OpenRouter {} {} pipeline execution",
                    openRouterConfig.source(), openRouterConfig.model());
        } else {
            log.info("Scheduled OpenRouter pipeline {} completed successfully", openRouterConfig.source());
        }
    }
}
