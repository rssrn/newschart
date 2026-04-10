package rossarn_at_gmail_dot_com.newschart.news.pipeline;

import org.springframework.stereotype.Service;

import rossarn_at_gmail_dot_com.newschart.callout.CalloutService;
import rossarn_at_gmail_dot_com.newschart.news.highlights.NewsHighlightsService;
import rossarn_at_gmail_dot_com.newschart.news.highlights.CalloutBuilderService;
import rossarn_at_gmail_dot_com.newschart.news.highlights.TopCountryHighlighter;
import rossarn_at_gmail_dot_com.newschart.news.source.NytRssIngestionService;
import rossarn_at_gmail_dot_com.newschart.news.source.NytRssParserService;

@Service
public class NytPipelineOrchestrator extends BasePipelineOrchestrator {

    private final NytRssIngestionService ingestionService;
    private final NytRssParserService parserService;
    private final TopCountryHighlighter highlighter;
    private final NewsHighlightsService highlightsService;
    private final CalloutBuilderService transformService;
    private final CalloutService calloutService;

    public NytPipelineOrchestrator(
            NytRssIngestionService nytRssIngestionService,
            NytRssParserService parserService,
            TopCountryHighlighter highlighter,
            NewsHighlightsService newsHighlightsService,
            CalloutBuilderService transformService, CalloutService calloutService) {
        this.ingestionService = nytRssIngestionService;
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
