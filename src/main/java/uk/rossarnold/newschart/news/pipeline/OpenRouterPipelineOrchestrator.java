package uk.rossarnold.newschart.news.pipeline;

import org.springframework.stereotype.Service;
import uk.rossarnold.newschart.ai.OpenRouterGatewayService;
import uk.rossarnold.newschart.callout.CalloutService;

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
