package uk.rossarnold.newschart.news.pipeline;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uk.rossarnold.newschart.ai.GeminiGatewayService;
import uk.rossarnold.newschart.ai.GeminiRouteConfig;
import uk.rossarnold.newschart.ai.OpenRouterGatewayService;
import uk.rossarnold.newschart.callout.Callout;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * @author Claude Opus 5.5 Anthropic
 */
@ExtendWith(MockitoExtension.class)
class GeminiPipelineStepTest {

    @Mock
    private GeminiGatewayService geminiGatewayService;
    @Mock
    private OpenRouterGatewayService openRouterGatewayService;

    private GeminiRouteConfig routeConfig;
    private GeminiPipelineStep step;

    private final List<Callout> callouts = List.of(new Callout.Builder(Instant.now()).headline("H").build());

    @BeforeEach
    void setUp() {
        routeConfig = new GeminiRouteConfig();
        step = new GeminiPipelineStep(geminiGatewayService, openRouterGatewayService, routeConfig);
    }

    @Test
    void openRouterRouteFetchesCalloutsWithConfiguredGeminiModel() {
        routeConfig.setRoute(GeminiRouteConfig.Route.OPENROUTER);
        when(openRouterGatewayService.getCallouts(routeConfig.getOpenrouterCalloutsModel())).thenReturn(Optional.of(callouts));

        PipelineContext context = step.execute(new PipelineContext());

        assertFalse(context.isFailed());
        assertEquals(callouts, context.getCallouts());
        verifyNoInteractions(geminiGatewayService);
    }

    @Test
    void directRouteFetchesCalloutsFromGemini() {
        routeConfig.setRoute(GeminiRouteConfig.Route.DIRECT);
        when(geminiGatewayService.getCallouts()).thenReturn(Optional.of(callouts));

        PipelineContext context = step.execute(new PipelineContext());

        assertFalse(context.isFailed());
        assertEquals(callouts, context.getCallouts());
        verifyNoInteractions(openRouterGatewayService);
    }

    @Test
    void marksContextFailedWhenNoCalloutsReturned() {
        when(openRouterGatewayService.getCallouts(anyString())).thenReturn(Optional.empty());

        assertTrue(step.execute(new PipelineContext()).isFailed());
    }
}
