package uk.rossarnold.newschart.news.pipeline;

import uk.rossarnold.newschart.callout.CalloutService;

public class SkipIfCalloutExistsPipelineStep implements PipelineStep {

    private final CalloutService calloutService;

    public SkipIfCalloutExistsPipelineStep(CalloutService calloutService) {
        this.calloutService = calloutService;
    }

    @Override
    public PipelineContext execute(PipelineContext context) {
        if (calloutService.haveCalloutForToday(context.getCalloutSource())) {
            context.setSkipped(true);
        }
        return context;
    }
}
