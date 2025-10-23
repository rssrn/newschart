package rossarn_at_gmail_dot_com.newschart.pipeline;

public interface PipelineStep {
    PipelineContext execute(PipelineContext context);
}

