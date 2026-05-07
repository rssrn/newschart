package rossarn_at_gmail_dot_com.newschart.news.pipeline;

import org.springframework.stereotype.Service;
import rossarn_at_gmail_dot_com.newschart.ai.OpenRouterGatewayService;
import rossarn_at_gmail_dot_com.newschart.callout.CalloutService;

@Service
public class OpenRouterPipelineOrchestrator extends BasePipelineOrchestrator {

    private final CalloutService calloutService;
    private final OpenRouterGatewayService openRouterGatewayService;

    public OpenRouterPipelineOrchestrator(CalloutService calloutService, OpenRouterGatewayService openRouterGatewayService) {
        this.calloutService = calloutService;
        this.openRouterGatewayService = openRouterGatewayService;

        setOrderedPipelineSteps();
    }

    private void setOrderedPipelineSteps() {
        pipelineSteps.add(new OpenRouterPipelineStep(openRouterGatewayService)); // hit model via OpenRouter to generate the callouts
        pipelineSteps.add(calloutService);         // save the callouts
    }
}
