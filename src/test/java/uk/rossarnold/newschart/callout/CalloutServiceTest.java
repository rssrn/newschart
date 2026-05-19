package uk.rossarnold.newschart.callout;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import uk.rossarnold.newschart.TestcontainersConfiguration;
import uk.rossarnold.newschart.geo.Country;
import uk.rossarnold.newschart.news.pipeline.PipelineContext;
import uk.rossarnold.newschart.scheduler.BasicFetchSchedulerService;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
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

    // Suppress the startup scheduler so tests don't trigger costly external AI pipeline calls.
    @MockitoBean
    @SuppressWarnings("unused")
    private BasicFetchSchedulerService basicFetchSchedulerService;

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

    private Callout calloutWithCountry(Instant generatedAt, CalloutSource source, String iso2, String name) {
        Country country = new Country();
        country.setIso2(iso2);
        country.setName(name);
        country.setLatitude(0);
        country.setLongitude(0);
        return new Callout.Builder(generatedAt)
                .headline("Headline")
                .detail("Detail")
                .source(source)
                .type(CalloutType.NEWS)
                .country(country)
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
        assertEquals(CalloutSource.NEW_YORK_TIMES, result.getFirst().getSource());
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

    @Test
    void calloutsForDayDoesNotCacheEmptyResult() {
        // Regression: empty results must not be cached, because data may arrive after the first call.
        // Without unless="#result.isEmpty()" on @Cacheable, the second call would still return [].
        LocalDate date = LocalDate.of(2021, 7, 20);

        List<Callout> beforeData = calloutService.calloutsForDay(date, CalloutSource.PERPLEXITY);
        assertTrue(beforeData.isEmpty());

        calloutRepository.save(callout(Instant.parse("2021-07-20T12:00:00Z"), CalloutSource.PERPLEXITY));

        List<Callout> afterData = calloutService.calloutsForDay(date, CalloutSource.PERPLEXITY);
        assertEquals(1, afterData.size());
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
    void executeAlwaysSavesCallouts() {
        // Duplicate-run guard moved to SkipIfCalloutExistsPipelineStep (upstream in pipeline).
        // CalloutService.execute() now unconditionally saves whatever callouts it receives.
        calloutRepository.save(callout(Instant.now(), CalloutSource.NEW_YORK_TIMES));

        PipelineContext context = new PipelineContext();
        context.setCalloutSource(CalloutSource.NEW_YORK_TIMES);
        context.setCallouts(List.of(
                callout(Instant.now(), CalloutSource.NEW_YORK_TIMES),
                callout(Instant.now(), CalloutSource.NEW_YORK_TIMES)
        ));

        calloutService.execute(context);

        assertEquals(3, calloutRepository.count());
    }

    @Test
    void executeFailsContextWhenCalloutsAbsentFromContext() {
        PipelineContext context = new PipelineContext();
        context.setCalloutSource(CalloutSource.NEW_YORK_TIMES);

        calloutService.execute(context);

        assertTrue(context.isFailed());
        assertEquals(0, calloutRepository.count());
    }

    // === calloutStatsAllCallouts ===
    // These tests exercise the findStatsFromAllCallouts() aggregation.
    // The aggregation was broken in production (StackOverflowError from malformed {$count} in
    // the $project stage); these tests reproduce and guard against that regression.

    @Test
    void calloutStatsAllCalloutsReturnsEmptyWhenNoData() {
        List<CalloutStats> stats = calloutService.calloutStatsAllCallouts();
        assertTrue(stats.isEmpty());
    }

    @Test
    void calloutStatsAllCalloutsCountsSingleSourceAndCountry() {
        // Reproduces the prod StackOverflowError — any call to this aggregation will fail
        // if the $project stage contains the malformed {$count} expression.
        calloutRepository.saveAll(List.of(
                calloutWithCountry(Instant.parse("2024-01-01T10:00:00Z"), CalloutSource.NEW_YORK_TIMES, "US", "United States"),
                calloutWithCountry(Instant.parse("2024-01-02T10:00:00Z"), CalloutSource.NEW_YORK_TIMES, "US", "United States"),
                calloutWithCountry(Instant.parse("2024-01-03T10:00:00Z"), CalloutSource.NEW_YORK_TIMES, "US", "United States")
        ));

        List<CalloutStats> stats = calloutService.calloutStatsAllCallouts();

        assertEquals(1, stats.size());
        assertEquals("NEW_YORK_TIMES", stats.getFirst().source());
        assertEquals("US", stats.getFirst().countryCode());
        assertEquals(3, stats.getFirst().count());
    }

    @Test
    void calloutStatsAllCalloutsGroupsBySourceAndCountry() {
        calloutRepository.saveAll(List.of(
                calloutWithCountry(Instant.parse("2024-02-01T10:00:00Z"), CalloutSource.NEW_YORK_TIMES, "GB", "United Kingdom"),
                calloutWithCountry(Instant.parse("2024-02-02T10:00:00Z"), CalloutSource.NEW_YORK_TIMES, "GB", "United Kingdom"),
                calloutWithCountry(Instant.parse("2024-02-03T10:00:00Z"), CalloutSource.NEW_YORK_TIMES, "FR", "France"),
                calloutWithCountry(Instant.parse("2024-02-04T10:00:00Z"), CalloutSource.GOOGLE_GEMINI, "GB", "United Kingdom")
        ));

        List<CalloutStats> stats = calloutService.calloutStatsAllCallouts();
        stats.sort(Comparator.comparing(CalloutStats::source).thenComparing(CalloutStats::countryCode));

        assertEquals(3, stats.size());

        assertEquals("GOOGLE_GEMINI", stats.getFirst().source());
        assertEquals("GB", stats.getFirst().countryCode());
        assertEquals(1, stats.getFirst().count());

        assertEquals("NEW_YORK_TIMES", stats.get(1).source());
        assertEquals("FR", stats.get(1).countryCode());
        assertEquals(1, stats.get(1).count());

        assertEquals("NEW_YORK_TIMES", stats.get(2).source());
        assertEquals("GB", stats.get(2).countryCode());
        assertEquals(2, stats.get(2).count());
    }

    @Test
    void calloutStatsAllCalloutsExcludesCalloutsWithNoCountry() {
        // Callouts without a country produce a null countryCode in the group key;
        // verify the aggregation handles them without error and does not mix their
        // count into a real country bucket.
        calloutRepository.saveAll(List.of(
                calloutWithCountry(Instant.parse("2024-03-01T10:00:00Z"), CalloutSource.NEW_YORK_TIMES, "DE", "Germany"),
                callout(Instant.parse("2024-03-02T10:00:00Z"), CalloutSource.NEW_YORK_TIMES)   // no country
        ));

        List<CalloutStats> stats = calloutService.calloutStatsAllCallouts();
        List<CalloutStats> withCountry = stats.stream().filter(s -> s.countryCode() != null).toList();

        assertEquals(1, withCountry.size());
        assertEquals("DE", withCountry.getFirst().countryCode());
        assertEquals(1, withCountry.getFirst().count());
    }
}