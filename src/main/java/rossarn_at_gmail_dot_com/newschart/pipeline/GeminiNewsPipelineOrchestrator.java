package rossarn_at_gmail_dot_com.newschart.pipeline;

import org.springframework.stereotype.Service;
import rossarn_at_gmail_dot_com.newschart.callout_repository.CalloutService;

/**
 * Use Google Gemini to find top news stories
 */
@Service
public class GeminiNewsPipelineOrchestrator extends BasePipelineOrchestrator {

    private final GeminiNewsPipelineStep geminiNewsPipelineStep;
    private final CalloutService calloutService;

    public GeminiNewsPipelineOrchestrator(GeminiNewsPipelineStep geminiNewsPipelineStep, CalloutService calloutService) {
        this.geminiNewsPipelineStep = geminiNewsPipelineStep;
        this.calloutService = calloutService;

        setOrderedPipelineSteps();
    }

    private void setOrderedPipelineSteps() {
        pipelineSteps.add(geminiNewsPipelineStep); // gemini to generate the callouts
        pipelineSteps.add(calloutService);         // save the callouts
    }

}
