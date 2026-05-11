package uk.rossarnold.newschart.news.pipeline;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import uk.rossarnold.newschart.ai.OpenRouterGatewayService;
import uk.rossarnold.newschart.callout.Callout;

import java.util.List;
import java.util.Optional;

public class OpenRouterPipelineStep implements PipelineStep {

    private final OpenRouterGatewayService openRouterGatewayService;

    private static final Logger log = LogManager.getLogger(OpenRouterPipelineStep.class);

    public OpenRouterPipelineStep(OpenRouterGatewayService openRouterGatewayService) {
        this.openRouterGatewayService = openRouterGatewayService;
    }

    @Override
    public PipelineContext execute(PipelineContext context) {

        Optional<List<Callout>> calloutsOpt = openRouterGatewayService.getCallouts(context.getModel());

        if (calloutsOpt.isEmpty()) {
            log.error("OpenRouter {} {} failed to generate news items", context.getCalloutSource(), context.getModel());
            context.setFailed(true);
        } else {
            log.info("Got {} callouts from {} {}", calloutsOpt.get().size(), context.getCalloutSource(), context.getModel());
            context.setCallouts(calloutsOpt.get());
        }

        return context;
    }
}
