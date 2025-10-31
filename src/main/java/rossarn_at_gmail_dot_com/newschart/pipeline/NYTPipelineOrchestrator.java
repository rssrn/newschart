package rossarn_at_gmail_dot_com.newschart.pipeline;

import org.springframework.stereotype.Service;

import rossarn_at_gmail_dot_com.newschart.callout_repository.CalloutService;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsHighlightsService;
import rossarn_at_gmail_dot_com.newschart.news_logic.HighlightsTransformerService;
import rossarn_at_gmail_dot_com.newschart.news_logic.MostCommonCountryHighlighter;
import rossarn_at_gmail_dot_com.newschart.news_source.NewYorkTimesRssIngestionService;
import rossarn_at_gmail_dot_com.newschart.news_source.NewYorkTimesRssParserService;

@Service
public class NYTPipelineOrchestrator extends BasePipelineOrchestrator {

    private final NewYorkTimesRssIngestionService ingestionService;
    private final NewYorkTimesRssParserService parserService;
    private final MostCommonCountryHighlighter highlighter;
    private final NewsHighlightsService highlightsService;
    private final HighlightsTransformerService transformService;
    private final CalloutService calloutService;

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
}
