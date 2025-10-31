package rossarn_at_gmail_dot_com.newschart.scheduler;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import rossarn_at_gmail_dot_com.newschart.pipeline.NYTPipelineOrchestrator;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;


/***
 * Schedule to fetch from all our sources soon after startup
 */
@Component
@Profile({"dev", "default"}) // TODO make a similar class for prod that uses @Scheduled(cron = "0 30 2 * * *\")") etc
public class BasicFetchSchedulerService extends SchedulerBase{

    private static final Logger log = LogManager.getLogger(BasicFetchSchedulerService.class);

    private final ScheduledExecutorService executorService = Executors.newSingleThreadScheduledExecutor();

    private final boolean nytFetchEnabled;
    private final int nytFetchDelaySeconds;

    public BasicFetchSchedulerService(NYTPipelineOrchestrator nytPipelineOrchestrator,
                                      @Value("${newschart.dev.nyt.enabled:true}") boolean nytFetchEnabled,
                                      @Value("${newschart.dev.nyt.fetchdelay:5}") int nytFetchDelaySeconds) {
        super(nytPipelineOrchestrator);
        this.nytFetchEnabled = nytFetchEnabled;
        this.nytFetchDelaySeconds = nytFetchDelaySeconds;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void applicationReady() {
        log.info("Application ready - scheduling actions according to config");
        scheduleNYT();
    }

    private void scheduleNYT() {
        if(nytFetchEnabled) {
            executorService.schedule(this::fetchNewYorkTimes, nytFetchDelaySeconds, TimeUnit.SECONDS);
            log.info("Scheduled NYT pipeline for {} seconds in the future", nytFetchDelaySeconds);
        } else {
            log.info("NYT fetch is disabled in config, skipping");
        }
    }
}
