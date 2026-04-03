package rossarn_at_gmail_dot_com.newschart.news.pipeline;

import org.springframework.stereotype.Service;
import rossarn_at_gmail_dot_com.newschart.ai.GeminiGatewayService;
import rossarn_at_gmail_dot_com.newschart.callout.CalloutService;

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
        pipelineSteps.add(new GeminiPipelineStep(geminiGatewayService)); // gemini to generate the callouts
        pipelineSteps.add(calloutService);         // save the callouts
    }

}
