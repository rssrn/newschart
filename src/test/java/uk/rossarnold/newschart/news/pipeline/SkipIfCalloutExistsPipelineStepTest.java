package uk.rossarnold.newschart.news.pipeline;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uk.rossarnold.newschart.callout.CalloutService;
import uk.rossarnold.newschart.callout.CalloutSource;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * @author Claude Sonnet 4.6 Anthropic
 */
@ExtendWith(MockitoExtension.class)
class SkipIfCalloutExistsPipelineStepTest {

    @Mock
    private CalloutService calloutService;

    @Test
    void setsSkippedWhenCalloutsAlreadyExistForToday() {
        PipelineContext context = new PipelineContext();
        context.setCalloutSource(CalloutSource.GOOGLE_GEMINI);
        when(calloutService.haveCalloutForToday(CalloutSource.GOOGLE_GEMINI)).thenReturn(true);

        new SkipIfCalloutExistsPipelineStep(calloutService).execute(context);

        assertTrue(context.isSkipped());
    }

    @Test
    void doesNotSkipWhenNoCalloutsExistForToday() {
        PipelineContext context = new PipelineContext();
        context.setCalloutSource(CalloutSource.GOOGLE_GEMINI);
        when(calloutService.haveCalloutForToday(CalloutSource.GOOGLE_GEMINI)).thenReturn(false);

        new SkipIfCalloutExistsPipelineStep(calloutService).execute(context);

        assertFalse(context.isSkipped());
    }
}
