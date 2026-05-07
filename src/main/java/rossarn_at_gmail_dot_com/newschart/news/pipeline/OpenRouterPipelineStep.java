package rossarn_at_gmail_dot_com.newschart.news.pipeline;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import rossarn_at_gmail_dot_com.newschart.ai.OpenRouterGatewayService;
import rossarn_at_gmail_dot_com.newschart.callout.Callout;

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
