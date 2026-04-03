package rossarn_at_gmail_dot_com.newschart.news.pipeline;

public interface PipelineStep {
    PipelineContext execute(PipelineContext context);
}

