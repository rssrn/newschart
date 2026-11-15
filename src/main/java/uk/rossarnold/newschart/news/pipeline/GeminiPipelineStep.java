package uk.rossarnold.newschart.news.pipeline;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import uk.rossarnold.newschart.ai.GeminiGatewayService;
import uk.rossarnold.newschart.ai.GeminiRouteConfig;
import uk.rossarnold.newschart.ai.OpenRouterGatewayService;
import uk.rossarnold.newschart.callout.Callout;

import java.util.List;
import java.util.Optional;

public class GeminiPipelineStep implements PipelineStep {

    private final GeminiGatewayService geminiGatewayService;
    private final OpenRouterGatewayService openRouterGatewayService;
    private final GeminiRouteConfig routeConfig;

    private static final Logger log = LogManager.getLogger(GeminiPipelineStep.class);

    public GeminiPipelineStep(GeminiGatewayService geminiGatewayService,
                              OpenRouterGatewayService openRouterGatewayService,
                              GeminiRouteConfig routeConfig) {
        this.geminiGatewayService = geminiGatewayService;
        this.openRouterGatewayService = openRouterGatewayService;
        this.routeConfig = routeConfig;
    }

    @Override
    public PipelineContext execute(PipelineContext context) {

        // Either route saves under GOOGLE_GEMINI - CalloutService takes the source from the context
        Optional<List<Callout>> calloutsOpt = routeConfig.viaOpenRouter()
                ? openRouterGatewayService.getCallouts(routeConfig.getOpenrouterCalloutsModel())
                : geminiGatewayService.getCallouts();

        if (calloutsOpt.isEmpty()) {
            log.error("Gemini ({}) failed to generate news items", routeConfig.getRoute());
            context.setFailed(true);
        } else {
            context.setCallouts(calloutsOpt.get());
        }

        return context;
    }
}
