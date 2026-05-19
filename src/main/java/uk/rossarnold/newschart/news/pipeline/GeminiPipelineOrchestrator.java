package uk.rossarnold.newschart.news.pipeline;

import org.springframework.stereotype.Service;
import uk.rossarnold.newschart.ai.GeminiGatewayService;
import uk.rossarnold.newschart.callout.CalloutService;

/**
 * Use Google Gemini to find top news stories
 */
@Service
public class GeminiPipelineOrchestrator extends BasePipelineOrchestrator {

    private final CalloutService calloutService;
    private final GeminiGatewayService geminiGatewayService;

    public GeminiPipelineOrchestrator(CalloutService calloutService, GeminiGatewayService geminiGatewayService) {
        this.calloutService = calloutService;
        this.geminiGatewayService = geminiGatewayService;

        setOrderedPipelineSteps();
    }

    private void setOrderedPipelineSteps() {
        pipelineSteps.add(new SkipIfCalloutExistsPipelineStep(calloutService));  // skip if already fetched today
        pipelineSteps.add(new GeminiPipelineStep(geminiGatewayService)); // gemini to generate the callouts
        pipelineSteps.add(calloutService);         // save the callouts
    }

}
