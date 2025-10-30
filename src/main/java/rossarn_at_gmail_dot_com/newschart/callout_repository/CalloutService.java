package rossarn_at_gmail_dot_com.newschart.callout_repository;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import rossarn_at_gmail_dot_com.newschart.pipeline.PipelineContext;
import rossarn_at_gmail_dot_com.newschart.pipeline.PipelineStep;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.List;
import java.util.Objects;

@Service
public class CalloutService implements PipelineStep {

    private static final Logger log = LogManager.getLogger(CalloutService.class);

    private final CalloutRepository calloutRepository;

    @Autowired
    public CalloutService(CalloutRepository repository) {
        this.calloutRepository = repository;
    }

    public StoryCallout saveStoryCallout(StoryCallout storyCallout) {
        log.info("Saving StoryCallout");
        return calloutRepository.save(storyCallout);
    }

    public List<StoryCallout> getAllCallouts() {
        return calloutRepository.findAllDocuments();
    }

    @Override
    public PipelineContext execute(PipelineContext context) {
        List<StoryCallout> callouts = context.getCallouts();
        if (Objects.isNull(callouts)) {
            log.error("Pipeline step missing callouts");
            context.setFailed(true);
            return context;
        }
        calloutRepository.saveAll(callouts);
        return context;
    }

    public List<StoryCallout> calloutsForDay(LocalDate date) {

        ZonedDateTime startOfDay = date.atStartOfDay(ZoneId.of("UTC"));
        ZonedDateTime endOfDay = startOfDay.plusDays(1);

        Date startDate = Date.from(startOfDay.toInstant());
        Date endDate = Date.from(endOfDay.toInstant());

        return calloutRepository.findByGeneratedAtBetween(startDate, endDate);
    }
}
