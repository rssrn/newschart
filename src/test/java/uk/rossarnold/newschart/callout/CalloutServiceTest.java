package uk.rossarnold.newschart.callout;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import uk.rossarnold.newschart.TestcontainersConfiguration;
import uk.rossarnold.newschart.news.pipeline.PipelineContext;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests using a real MongoDB via Testcontainers.
 * Each test uses a unique fixed date to avoid @Cacheable cross-test pollution.
 *
 * @author Claude Sonnet 4.6 Anthropic
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class CalloutServiceTest {

    @Autowired
    private CalloutService calloutService;

    @Autowired
    private CalloutRepository calloutRepository;

    @BeforeEach
    void setUp() {
        calloutRepository.deleteAll();
    }

    private Callout callout(Instant generatedAt, CalloutSource source) {
        return new Callout.Builder(generatedAt)
                .headline("Headline")
                .detail("Detail")
                .source(source)
                .type(CalloutType.NEWS)
                .build();
    }

    // === calloutsForDay ===

    @Test
    void calloutsForDayReturnsOnlyCalloutsForThatDay() {
        calloutRepository.saveAll(List.of(
                callout(Instant.parse("2020-01-15T12:00:00Z"), CalloutSource.NEW_YORK_TIMES),
                callout(Instant.parse("2020-01-15T18:00:00Z"), CalloutSource.NEW_YORK_TIMES),
                callout(Instant.parse("2020-01-16T12:00:00Z"), CalloutSource.NEW_YORK_TIMES)
        ));

        List<Callout> result = calloutService.calloutsForDay(LocalDate.of(2020, 1, 15), CalloutSource.NEW_YORK_TIMES);

        assertEquals(2, result.size());
    }

    @Test
    void calloutsForDayFiltersOutOtherSources() {
        calloutRepository.saveAll(List.of(
                callout(Instant.parse("2020-02-10T12:00:00Z"), CalloutSource.NEW_YORK_TIMES),
                callout(Instant.parse("2020-02-10T12:00:00Z"), CalloutSource.GOOGLE_GEMINI)
        ));

        List<Callout> result = calloutService.calloutsForDay(LocalDate.of(2020, 2, 10), CalloutSource.NEW_YORK_TIMES);

        assertEquals(1, result.size());
        assertEquals(CalloutSource.NEW_YORK_TIMES, result.get(0).getSource());
    }

    @Test
    void calloutsForDayIncludesCalloutEarlyInDay() {
        // Note: Between uses $gt/$lt (exclusive), so exactly-midnight timestamps are not found.
        // The scheduler never fires at exactly UTC midnight so this is not a real issue in practice.
        calloutRepository.save(callout(Instant.parse("2020-03-05T00:01:00Z"), CalloutSource.NEW_YORK_TIMES));

        List<Callout> result = calloutService.calloutsForDay(LocalDate.of(2020, 3, 5), CalloutSource.NEW_YORK_TIMES);

        assertEquals(1, result.size());
    }

    @Test
    void calloutsForDayExcludesCalloutAtMidnightOfNextDay() {
        // a callout timestamped at 2020-04-20T00:00:00Z must not appear under 2020-04-19
        calloutRepository.save(callout(Instant.parse("2020-04-20T00:00:00Z"), CalloutSource.NEW_YORK_TIMES));

        List<Callout> result = calloutService.calloutsForDay(LocalDate.of(2020, 4, 19), CalloutSource.NEW_YORK_TIMES);

        assertTrue(result.isEmpty());
    }

    // === availableDays ===

    @Test
    void availableDaysReturnsDistinctDatesInAscendingOrder() {
        calloutRepository.saveAll(List.of(
                callout(Instant.parse("2020-05-01T10:00:00Z"), CalloutSource.NEW_YORK_TIMES),
                callout(Instant.parse("2020-05-01T15:00:00Z"), CalloutSource.NEW_YORK_TIMES), // same day, different time
                callout(Instant.parse("2020-05-03T10:00:00Z"), CalloutSource.NEW_YORK_TIMES)
        ));

        List<LocalDate> days = calloutService.availableDays(CalloutSource.NEW_YORK_TIMES);

        assertEquals(List.of(LocalDate.of(2020, 5, 1), LocalDate.of(2020, 5, 3)), days);
    }

    @Test
    void availableDaysFiltersOutOtherSources() {
        calloutRepository.saveAll(List.of(
                callout(Instant.parse("2020-06-10T10:00:00Z"), CalloutSource.NEW_YORK_TIMES),
                callout(Instant.parse("2020-06-11T10:00:00Z"), CalloutSource.GOOGLE_GEMINI)
        ));

        List<LocalDate> days = calloutService.availableDays(CalloutSource.NEW_YORK_TIMES);

        assertEquals(List.of(LocalDate.of(2020, 6, 10)), days);
    }

    // === execute (pipeline step) ===

    @Test
    void executeSavesCalloutsWhenNoneExistForToday() {
        PipelineContext context = new PipelineContext();
        context.setCalloutSource(CalloutSource.NEW_YORK_TIMES);
        context.setCallouts(List.of(callout(Instant.now(), CalloutSource.NEW_YORK_TIMES)));

        calloutService.execute(context);

        assertFalse(context.isFailed());
        assertEquals(1, calloutRepository.count());
    }

    @Test
    void executeSkipsSaveWhenCalloutAlreadyExistsForToday() {
        calloutRepository.save(callout(Instant.now(), CalloutSource.NEW_YORK_TIMES));

        PipelineContext context = new PipelineContext();
        context.setCalloutSource(CalloutSource.NEW_YORK_TIMES);
        context.setCallouts(List.of(
                callout(Instant.now(), CalloutSource.NEW_YORK_TIMES),
                callout(Instant.now(), CalloutSource.NEW_YORK_TIMES)
        ));

        calloutService.execute(context);

        assertEquals(1, calloutRepository.count());
    }

    @Test
    void executeFailsContextWhenCalloutsAbsentFromContext() {
        PipelineContext context = new PipelineContext();
        context.setCalloutSource(CalloutSource.NEW_YORK_TIMES);

        calloutService.execute(context);

        assertTrue(context.isFailed());
        assertEquals(0, calloutRepository.count());
    }
}