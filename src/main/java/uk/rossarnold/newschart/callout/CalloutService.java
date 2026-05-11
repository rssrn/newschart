package uk.rossarnold.newschart.callout;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import uk.rossarnold.newschart.news.pipeline.PipelineContext;
import uk.rossarnold.newschart.news.pipeline.PipelineStep;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class CalloutService implements PipelineStep {

    private static final Logger log = LogManager.getLogger(CalloutService.class);

    private final CalloutRepository calloutRepository;

    @Autowired
    public CalloutService(CalloutRepository repository) {
        this.calloutRepository = repository;
    }

    @Override
    public PipelineContext execute(PipelineContext context) {
        List<Callout> callouts = context.getCallouts();
        if (Objects.isNull(callouts)) {
            log.error("Pipeline step missing callouts");
            context.setFailed(true);
            return context;
        }
        CalloutSource source = context.getCalloutSource();

        // set callout source here, it's not populated by the model
        callouts.forEach(c -> c.setSource(source));

        // ideally this check is not necessary, but useful for local testing purposes
        if (haveCalloutForToday(source)) {
            log.warn("Already have at least one callout for source {} so ignoring new callouts", source);
        } else {
            calloutRepository.saveAll(callouts);
            log.info("Saved {} callouts for source {}", callouts.size(), source);
        }
        return context;
    }

    private boolean haveCalloutForToday(CalloutSource source) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Instant start = today.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        log.info("Checking start {} end {} source {}", start, end, source);

        Optional<Callout> firstMatch = calloutRepository.findFirstByGeneratedAtBetweenAndSourceOrderByGeneratedAtAsc(start, end, source);

        return firstMatch.isPresent();
    }

    @Cacheable(value="callouts", key="#date.toString() + '_' + #source.name()")
    public List<Callout> calloutsForDay(LocalDate date, CalloutSource source) {
        log.info("Cache miss for {} {} - fetching callouts from repository", date, source);

        ZonedDateTime startOfDay = date.atStartOfDay(ZoneId.of("UTC"));
        ZonedDateTime endOfDay = startOfDay.plusDays(1);

        Date startDate = Date.from(startOfDay.toInstant());
        Date endDate = Date.from(endOfDay.toInstant());

        return calloutRepository.findByGeneratedAtBetweenAndSource(startDate, endDate, source);
    }

    public List<LocalDate> availableDays(CalloutSource source) {
      return calloutRepository.findDistinctDaysBySource(source)
          .stream()
          .map(LocalDate::parse)
          .toList();
    }
}
