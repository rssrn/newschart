package uk.rossarnold.newschart.news.pipeline;

import org.springframework.stereotype.Service;
import uk.rossarnold.newschart.ai.GeminiGatewayService;
import uk.rossarnold.newschart.ai.GeminiRouteConfig;
import uk.rossarnold.newschart.ai.OpenRouterGatewayService;
import uk.rossarnold.newschart.callout.CalloutService;

/**
 * Use Google Gemini to find top news stories - directly or via OpenRouter, per {@link GeminiRouteConfig}
 */
@Service
public class GeminiPipelineOrchestrator extends BasePipelineOrchestrator {

    private final CalloutService calloutService;
    private final GeminiGatewayService geminiGatewayService;
    private final OpenRouterGatewayService openRouterGatewayService;
    private final GeminiRouteConfig routeConfig;

    public GeminiPipelineOrchestrator(CalloutService calloutService, GeminiGatewayService geminiGatewayService,
                                      OpenRouterGatewayService openRouterGatewayService, GeminiRouteConfig routeConfig) {
        this.calloutService = calloutService;
        this.geminiGatewayService = geminiGatewayService;
        this.openRouterGatewayService = openRouterGatewayService;
        this.routeConfig = routeConfig;

        setOrderedPipelineSteps();
    }

    private void setOrderedPipelineSteps() {
        pipelineSteps.add(new SkipIfCalloutExistsPipelineStep(calloutService));  // skip if already fetched today
        pipelineSteps.add(new GeminiPipelineStep(geminiGatewayService, openRouterGatewayService, routeConfig)); // gemini, direct or via OpenRouter
        pipelineSteps.add(calloutService);         // save the callouts
    }

}
