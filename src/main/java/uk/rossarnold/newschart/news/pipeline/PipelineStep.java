package uk.rossarnold.newschart.news.pipeline;

public interface PipelineStep {
    PipelineContext execute(PipelineContext context);
}

