package uk.rossarnold.newschart.ai;

import com.openai.errors.BadRequestException;
import com.openai.errors.InternalServerException;
import com.openai.errors.OpenAIIoException;
import com.openai.errors.RateLimitException;
import com.openai.errors.UnauthorizedException;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.test.context.TestPropertySource;
import uk.rossarnold.newschart.callout.Callout;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests for retry and recovery behaviour in OpenRouterGatewayService.
 * Uses a minimal Spring context (no MongoDB) so retry AOP proxying is active,
 * but avoids the full application startup cost.
 *
 * @author Claude Sonnet 4.6 Anthropic
 */
@SpringBootTest(classes = {OpenRouterGatewayServiceTest.Config.class, OpenRouterGatewayService.class})
@TestPropertySource(properties = "openrouter.retry.delay-ms=0")
class OpenRouterGatewayServiceTest {

    @TestConfiguration
    @EnableRetry
    static class Config {
        @Bean
        OpenAiChatModel openAiChatModel() {
            return Mockito.mock(OpenAiChatModel.class);
        }

        @Bean
        MeterRegistry meterRegistry() {
            return new SimpleMeterRegistry();
        }
    }

    @Autowired
    private OpenRouterGatewayService openRouterGatewayService;

    @Autowired
    private OpenAiChatModel openAiChatModel;

    @BeforeEach
    void resetMock() {
        Mockito.reset(openAiChatModel);
        when(openAiChatModel.getDefaultOptions())
                .thenReturn(OpenAiChatOptions.builder().model("test-model").build());
    }

    // === Retry behaviour ===

    @Test
    void retriesThreeTimesOnInternalServerExceptionThenRecovers() {
        when(openAiChatModel.call(any(Prompt.class))).thenThrow(Mockito.mock(InternalServerException.class));

        Optional<List<Callout>> result = openRouterGatewayService.getCallouts("test-model");

        assertTrue(result.isEmpty());
        verify(openAiChatModel, times(3)).call(any(Prompt.class));
    }

    @Test
    void retriesThreeTimesOnOpenAIIoExceptionThenRecovers() {
        when(openAiChatModel.call(any(Prompt.class))).thenThrow(new OpenAIIoException("connection timeout"));

        Optional<List<Callout>> result = openRouterGatewayService.getCallouts("test-model");

        assertTrue(result.isEmpty());
        verify(openAiChatModel, times(3)).call(any(Prompt.class));
    }

    @Test
    void retriesThreeTimesOnRateLimitExceptionThenRecovers() {
        when(openAiChatModel.call(any(Prompt.class))).thenThrow(Mockito.mock(RateLimitException.class));

        Optional<List<Callout>> result = openRouterGatewayService.getCallouts("test-model");

        assertTrue(result.isEmpty());
        verify(openAiChatModel, times(3)).call(any(Prompt.class));
    }

    @Test
    void doesNotRetryOnBadRequestExceptionAndRecovers() {
        when(openAiChatModel.call(any(Prompt.class))).thenThrow(Mockito.mock(BadRequestException.class));

        Optional<List<Callout>> result = openRouterGatewayService.getCallouts("test-model");

        assertTrue(result.isEmpty());
        verify(openAiChatModel, times(1)).call(any(Prompt.class));
    }

    @Test
    void doesNotRetryOnUnauthorizedExceptionAndRecovers() {
        when(openAiChatModel.call(any(Prompt.class))).thenThrow(Mockito.mock(UnauthorizedException.class));

        Optional<List<Callout>> result = openRouterGatewayService.getCallouts("test-model");

        assertTrue(result.isEmpty());
        verify(openAiChatModel, times(1)).call(any(Prompt.class));
    }

    // === Recovery method ===

    @Test
    void recoveryReturnsEmptyOptional() {
        Optional<List<Callout>> result = openRouterGatewayService.getCalloutsRecovery(new RuntimeException("exhausted"));

        assertTrue(result.isEmpty());
    }
}
