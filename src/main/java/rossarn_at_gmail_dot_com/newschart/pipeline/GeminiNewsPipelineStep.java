package rossarn_at_gmail_dot_com.newschart.pipeline;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import rossarn_at_gmail_dot_com.newschart.callout_repository.CalloutSource;

@Service
public class GeminiNewsPipelineStep implements PipelineStep {

    private static final Logger log = LogManager.getLogger(GeminiNewsPipelineStep.class);

    @Override
    public PipelineContext execute(PipelineContext context) {
        context.setCalloutSource(CalloutSource.GOOGLE_GEMINI);

        log.info("TODO: use Gemini to generate callouts");

        return context;
    }
}
