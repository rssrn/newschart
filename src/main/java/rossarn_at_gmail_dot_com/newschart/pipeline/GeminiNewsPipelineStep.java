package rossarn_at_gmail_dot_com.newschart.pipeline;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import rossarn_at_gmail_dot_com.newschart.ai.GeminiGatewayService;
import rossarn_at_gmail_dot_com.newschart.callout_repository.CalloutSource;
import rossarn_at_gmail_dot_com.newschart.callout_repository.StoryCallout;

import java.util.List;
import java.util.Optional;

public class GeminiNewsPipelineStep implements PipelineStep {

    private final GeminiGatewayService geminiGatewayService;

    private static final Logger log = LogManager.getLogger(GeminiNewsPipelineStep.class);

    public GeminiNewsPipelineStep(GeminiGatewayService geminiGatewayService) {
        this.geminiGatewayService = geminiGatewayService;
    }

    @Override
    public PipelineContext execute(PipelineContext context) {
        context.setCalloutSource(CalloutSource.GOOGLE_GEMINI);

        Optional<List<StoryCallout>> calloutsOpt = geminiGatewayService.getCallouts();

        if (calloutsOpt.isEmpty()) {
            log.error("Gemini failed to generate news items");
            context.setFailed(true);
        } else {
            context.setCallouts(calloutsOpt.get());
        }

        return context;
    }
}
