package uk.rossarnold.newschart.ai;

import com.google.genai.errors.ClientException;
import com.google.genai.errors.GenAiIOException;
import com.google.genai.errors.ServerException;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
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
 * Tests for retry and recovery behaviour in GeminiGatewayService.
 * Uses a minimal Spring context (no MongoDB) so retry AOP proxying is active,
 * but avoids the full application startup cost.
 *
 * @author Claude Sonnet 4.6 Anthropic
 */
@SpringBootTest(classes = {GeminiGatewayServiceTest.Config.class, GeminiGatewayService.class})
@TestPropertySource(properties = "gemini.retry.delay-ms=0")
class GeminiGatewayServiceTest {

    @TestConfiguration
    @EnableRetry
    static class Config {
        @Bean
        GoogleGenAiChatModel googleGenAiChatModel() {
            return Mockito.mock(GoogleGenAiChatModel.class);
        }

        @Bean
        MeterRegistry meterRegistry() {
            return new SimpleMeterRegistry();
        }
    }

    @Autowired
    private GeminiGatewayService geminiGatewayService;

    @Autowired
    private GoogleGenAiChatModel googleGenAiChatModel;

    @BeforeEach
    void resetMock() {
        Mockito.reset(googleGenAiChatModel);
        when(googleGenAiChatModel.getDefaultOptions())
                .thenReturn(GoogleGenAiChatOptions.builder().model("test-model").build());
    }

    // === Retry behaviour ===

    @Test
    void retriesThreeTimesOnServerExceptionThenRecovers() {
        when(googleGenAiChatModel.call(any(Prompt.class))).thenThrow(new ServerException(503, "Service Unavailable", "{}"));

        Optional<List<Callout>> result = geminiGatewayService.getCallouts();

        assertTrue(result.isEmpty());
        verify(googleGenAiChatModel, times(3)).call(any(Prompt.class));
    }

    @Test
    void retriesThreeTimesOnGenAiIOExceptionThenRecovers() {
        when(googleGenAiChatModel.call(any(Prompt.class))).thenThrow(new GenAiIOException("connection timeout"));

        Optional<List<Callout>> result = geminiGatewayService.getCallouts();

        assertTrue(result.isEmpty());
        verify(googleGenAiChatModel, times(3)).call(any(Prompt.class));
    }

    @Test
    void doesNotRetryOnClientExceptionAndRecovers() {
        when(googleGenAiChatModel.call(any(Prompt.class))).thenThrow(new ClientException(429, "Too Many Requests", "{}"));

        Optional<List<Callout>> result = geminiGatewayService.getCallouts();

        assertTrue(result.isEmpty());
        verify(googleGenAiChatModel, times(1)).call(any(Prompt.class));
    }

    // === Recovery method ===

    @Test
    void recoveryReturnsEmptyOptional() {
        Optional<List<Callout>> result = geminiGatewayService.getCalloutsRecovery(new RuntimeException("exhausted"));

        assertTrue(result.isEmpty());
    }
}
