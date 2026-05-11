package uk.rossarnold.newschart.news.pipeline;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import uk.rossarnold.newschart.ai.GeminiGatewayService;
import uk.rossarnold.newschart.callout.CalloutSource;
import uk.rossarnold.newschart.callout.Callout;

import java.util.List;
import java.util.Optional;

public class GeminiPipelineStep implements PipelineStep {

    private final GeminiGatewayService geminiGatewayService;

    private static final Logger log = LogManager.getLogger(GeminiPipelineStep.class);

    public GeminiPipelineStep(GeminiGatewayService geminiGatewayService) {
        this.geminiGatewayService = geminiGatewayService;
    }

    @Override
    public PipelineContext execute(PipelineContext context) {
        context.setCalloutSource(CalloutSource.GOOGLE_GEMINI);

        Optional<List<Callout>> calloutsOpt = geminiGatewayService.getCallouts();

        if (calloutsOpt.isEmpty()) {
            log.error("Gemini failed to generate news items");
            context.setFailed(true);
        } else {
            context.setCallouts(calloutsOpt.get());
        }

        return context;
    }
}
