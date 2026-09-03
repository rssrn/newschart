package uk.rossarnold.newschart.ai;

import com.openai.errors.BadRequestException;
import com.openai.errors.InternalServerException;
import com.openai.errors.OpenAIIoException;
import com.openai.errors.RateLimitException;
import com.openai.errors.UnauthorizedException;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.metadata.ChatResponseMetadata;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.reactive.function.client.WebClient;
import uk.rossarnold.newschart.ai.metadata.MetadataRepository;
import uk.rossarnold.newschart.callout.Callout;
import uk.rossarnold.newschart.callout.CalloutSource;
import uk.rossarnold.newschart.geo.Country;
import uk.rossarnold.newschart.geo.CountryFactory;
import uk.rossarnold.newschart.news.highlights.CountryNews;
import uk.rossarnold.newschart.news.highlights.NewsItem;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
@SpringBootTest(classes = {OpenRouterGatewayServiceTest.Config.class, OpenRouterGatewayService.class,
        LlmResponseMapper.class, CountryFactory.class})
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

        @Bean
        ThreadPoolTaskScheduler taskScheduler() {
            return Mockito.mock(ThreadPoolTaskScheduler.class);
        }

        @Bean(name = "openRouterWebClient")
        WebClient openRouterWebClient() {
            return Mockito.mock(WebClient.class);
        }

        @Bean
        MetadataRepository metadataRepository() {
            return Mockito.mock(MetadataRepository.class);
        }
    }

    private static final String NEPAL_OBJECT = """
            {"items":[{"country":{"iso2":"NP","isoNumeric":"524","latitude":28.3949,"longitude":84.124,
            "name":"Nepal"},"headline":"H","detail":"D","extendedDetail":"E"}]}
            """;

    @Autowired
    private OpenRouterGatewayService openRouterGatewayService;

    @Autowired
    private OpenAiChatModel openAiChatModel;

    @Autowired
    private MeterRegistry meterRegistry;

    @BeforeEach
    void resetMock() {
        Mockito.reset(openAiChatModel);
        when(openAiChatModel.getOptions())
                .thenReturn(OpenAiChatOptions.builder().model("test-model").build());
        meterRegistry.clear();
    }

    /** Make the mocked model reply with {@code body} as its assistant message text. */
    private void modelReplies(String body) {
        ChatResponse response = new ChatResponse(
                List.of(new Generation(new AssistantMessage(body))),
                ChatResponseMetadata.builder().id("gen-test").build());
        when(openAiChatModel.call(any(Prompt.class))).thenReturn(response);
    }

    private double parseFailures(String model, String reason) {
        Counter counter = meterRegistry.find(OpenRouterGatewayService.OPENROUTER_GETCALLOUTS_PARSE_FAILURES)
                .tag("model", model)
                .tag("reason", reason)
                .counter();
        return counter == null ? -1 : counter.count();
    }

    private double unparseable(String model) {
        return parseFailures(model, OpenRouterGatewayService.REASON_UNPARSEABLE);
    }

    private double unresolvableCountry(String model) {
        return parseFailures(model, OpenRouterGatewayService.REASON_UNRESOLVABLE_COUNTRY);
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

    // === getCallouts recovery ===

    @Test
    void recoveryReturnsEmptyOptional() {
        Optional<List<Callout>> result = openRouterGatewayService.getCalloutsRecovery(new RuntimeException("exhausted"));

        assertTrue(result.isEmpty());
    }

    // === summariseStories retry behaviour ===

    @Test
    void summariseStoriesRetriesThreeTimesOnInternalServerExceptionThenRecovers() {
        when(openAiChatModel.call(any(Prompt.class))).thenThrow(Mockito.mock(InternalServerException.class));

        Optional<StoryOutline> result = openRouterGatewayService.summariseStories(testCountryNews());

        assertTrue(result.isEmpty());
        verify(openAiChatModel, times(3)).call(any(Prompt.class));
    }

    @Test
    void summariseStoriesRetriesThreeTimesOnOpenAIIoExceptionThenRecovers() {
        when(openAiChatModel.call(any(Prompt.class))).thenThrow(new OpenAIIoException("connection timeout"));

        Optional<StoryOutline> result = openRouterGatewayService.summariseStories(testCountryNews());

        assertTrue(result.isEmpty());
        verify(openAiChatModel, times(3)).call(any(Prompt.class));
    }

    @Test
    void summariseStoriesRetriesThreeTimesOnRateLimitExceptionThenRecovers() {
        when(openAiChatModel.call(any(Prompt.class))).thenThrow(Mockito.mock(RateLimitException.class));

        Optional<StoryOutline> result = openRouterGatewayService.summariseStories(testCountryNews());

        assertTrue(result.isEmpty());
        verify(openAiChatModel, times(3)).call(any(Prompt.class));
    }

    @Test
    void summariseStoriesDoesNotRetryOnBadRequestExceptionAndRecovers() {
        when(openAiChatModel.call(any(Prompt.class))).thenThrow(Mockito.mock(BadRequestException.class));

        Optional<StoryOutline> result = openRouterGatewayService.summariseStories(testCountryNews());

        assertTrue(result.isEmpty());
        verify(openAiChatModel, times(1)).call(any(Prompt.class));
    }

    @Test
    void summariseStoriesDoesNotRetryOnUnauthorizedExceptionAndRecovers() {
        when(openAiChatModel.call(any(Prompt.class))).thenThrow(Mockito.mock(UnauthorizedException.class));

        Optional<StoryOutline> result = openRouterGatewayService.summariseStories(testCountryNews());

        assertTrue(result.isEmpty());
        verify(openAiChatModel, times(1)).call(any(Prompt.class));
    }

    // === summariseStories recovery ===

    @Test
    void summariseStoriesRecoveryReturnsEmptyOptional() {
        Optional<StoryOutline> result = openRouterGatewayService.summariseStoriesRecovery(new RuntimeException("exhausted"));

        assertTrue(result.isEmpty());
    }

    // === parse-failure metric ===

    @Test
    void registersParseFailureCounterAtZeroOnASuccessfulCall() {
        modelReplies(NEPAL_OBJECT);

        Optional<List<Callout>> result = openRouterGatewayService.getCallouts("test-model");

        assertTrue(result.isPresent());
        assertEquals(1, result.get().size());
        // both series must exist at 0 so the alert has a baseline rather than no-data
        assertEquals(0.0, unparseable("test-model"));
        assertEquals(0.0, unresolvableCountry("test-model"));
    }

    @Test
    void countsAParseFailureAndTagsItWithTheModel() {
        modelReplies("{\"items\":[{\"country\":{\"iso2\": }}]}"); // malformed JSON

        Optional<List<Callout>> result = openRouterGatewayService.getCallouts("test-model");

        assertTrue(result.isEmpty());
        assertEquals(1.0, unparseable("test-model"));
        // this path never reaches @Recover, so the exhausted counter must stay untouched
        assertEquals(0.0, meterRegistry.counter(OpenRouterGatewayService.OPENROUTER_GETCALLOUTS_EXHAUSTED).count());
    }

    @Test
    void doesNotRetryOnAParseFailure() {
        modelReplies("not json at all");

        openRouterGatewayService.getCallouts("test-model");

        // the response already arrived, so a retry would just pay for the same call again
        verify(openAiChatModel, times(1)).call(any(Prompt.class));
    }

    // === tolerant country binding ===

    @Test
    void recoversAResponseThatGivesTheCountryAsABareName() {
        // the shape perplexity/sonar-pro-search returned on 2026-09-01
        modelReplies("""
                {"items":[{"country":"Nepal","headline":"H","detail":"D","extendedDetail":"E"}]}
                """);

        Optional<List<Callout>> result = openRouterGatewayService.getCallouts("test-model");

        assertTrue(result.isPresent());
        assertEquals(1, result.get().size());
        assertEquals("Nepal", result.get().getFirst().getCountry().getName());
        assertEquals(0.0, unparseable("test-model"));
    }

    @Test
    void dropsOnlyTheCalloutWhoseCountryNameCannotBeResolved() {
        modelReplies("""
                {"items":[
                  {"country":"Palestine","headline":"unresolvable","detail":"D","extendedDetail":"E"},
                  {"country":"Nepal","headline":"keeper","detail":"D","extendedDetail":"E"}
                ]}
                """);

        Optional<List<Callout>> result = openRouterGatewayService.getCallouts("test-model");

        assertTrue(result.isPresent());
        assertEquals(1, result.get().size(), "the resolvable callout should survive");
        assertEquals("keeper", result.get().getFirst().getHeadline());
        // a partial response is not a parse failure - nothing to alert on
        assertEquals(0.0, unresolvableCountry("test-model"));
    }

    @Test
    void failsRatherThanReturningAnEmptyListWhenNoCountryResolves() {
        modelReplies("""
                {"items":[
                  {"country":"Palestine","headline":"A","detail":"D","extendedDetail":"E"},
                  {"country":"Atlantis","headline":"B","detail":"D","extendedDetail":"E"}
                ]}
                """);

        Optional<List<Callout>> result = openRouterGatewayService.getCallouts("test-model");

        // an empty list would be logged by the pipeline as "Got 0 callouts" and pass as a success,
        // which is exactly the silent gap this whole change exists to close
        assertTrue(result.isEmpty());
        assertEquals(1.0, unresolvableCountry("test-model"));
        assertEquals(0.0, unparseable("test-model"));
    }

    @Test
    void treatsAGenuinelyEmptyItemListAsSuccessNotAParseFailure() {
        modelReplies("""
                {"items":[]}
                """);

        Optional<List<Callout>> result = openRouterGatewayService.getCallouts("test-model");

        assertTrue(result.isPresent());
        assertEquals(0, result.get().size());
        assertEquals(0.0, unresolvableCountry("test-model"));
    }

    private CountryNews testCountryNews() {
        Country country = new Country();
        country.setName("Test Country");
        NewsItem item = new NewsItem(CalloutSource.NEW_YORK_TIMES, "Test headline", "http://test", "Test content", List.of());
        return new CountryNews(country, List.of(item));
    }
}
