package rossarn_at_gmail_dot_com.newschart.pipeline;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import rossarn_at_gmail_dot_com.newschart.callout_repository.CalloutService;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsHighlightsService;
import rossarn_at_gmail_dot_com.newschart.news_logic.HighlightsTransformerService;
import rossarn_at_gmail_dot_com.newschart.news_logic.MostCommonCountryHighlighter;
import rossarn_at_gmail_dot_com.newschart.news_source.NewYorkTimesRssIngestionService;
import rossarn_at_gmail_dot_com.newschart.news_source.NewYorkTimesRssParserService;

import java.util.ArrayList;
import java.util.List;

@Service
public class NYTPipelineOrchestrator {

    private static final Logger log = LogManager.getLogger(NYTPipelineOrchestrator.class);

    private final NewYorkTimesRssIngestionService ingestionService;
    private final NewYorkTimesRssParserService parserService;
    private final MostCommonCountryHighlighter highlighter;
    private final NewsHighlightsService highlightsService;
    private final HighlightsTransformerService transformService;
    private final CalloutService calloutService;

    private final List<PipelineStep> pipelineSteps = new ArrayList<>();

    @Autowired
    public NYTPipelineOrchestrator(
            NewYorkTimesRssIngestionService newYorkTimesRssIngestionService,
            NewYorkTimesRssParserService parserService,
            MostCommonCountryHighlighter highlighter,
            NewsHighlightsService newsHighlightsService,
            HighlightsTransformerService transformService, CalloutService calloutService) {
        this.ingestionService = newYorkTimesRssIngestionService;
        this.parserService = parserService;
        this.highlighter = highlighter;
        this.highlightsService = newsHighlightsService;
        this.transformService = transformService;
        this.calloutService = calloutService;

        setOrderedPipelineSteps();
    }

    /**
     * Set up pipeline steps.  Could have chosen to inject using @Order on each PipelineStep, but do it manually
     * so steps can be re-used in other pipelines.
     */
    private void setOrderedPipelineSteps() {
        pipelineSteps.add(ingestionService);  // ingest NYT RSS
        pipelineSteps.add(parserService);     // parse the RSS
        pipelineSteps.add(highlighter);       // extract crucial details e.g. stories for top X countries, by country
        pipelineSteps.add(highlightsService); // save the highlights to repo
        pipelineSteps.add(transformService);  // transform to summarised concise callouts - data suitable for display
        pipelineSteps.add(calloutService);    // save callouts to repo
    }

    /**
     * TODO: we need a timer and/or user action to kick off the pipeline.  Until then, just bootstrapping once on startup.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void applicationReady() {
        log.info("Application ready, starting pipeline {}", this.getClass());
        executePipeline();
    }

    public PipelineContext executePipeline() {
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
