package rossarn_at_gmail_dot_com.newschart.scheduler;

import jakarta.annotation.PreDestroy;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import rossarn_at_gmail_dot_com.newschart.pipeline.GeminiNewsPipelineOrchestrator;
import rossarn_at_gmail_dot_com.newschart.pipeline.NYTPipelineOrchestrator;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;


/***
 * Schedule to fetch from all our sources soon after startup
 */
@Component
@Profile({"dev", "default"}) // TODO make a similar class for prod that uses @Scheduled(cron = "0 30 2 * * *\")") etc
public class BasicFetchSchedulerService extends BaseScheduler {

    private static final Logger log = LogManager.getLogger(BasicFetchSchedulerService.class);

    private final ScheduledExecutorService executorService = Executors.newSingleThreadScheduledExecutor();
    private final BasicFetchSchedulerConfig config;

    public BasicFetchSchedulerService(NYTPipelineOrchestrator nytPipelineOrchestrator,
                                      GeminiNewsPipelineOrchestrator geminiNewsPipelineOrchestrator,
                                      BasicFetchSchedulerConfig config) {
        super(nytPipelineOrchestrator, geminiNewsPipelineOrchestrator);
        this.config = config;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void applicationReady() {
        log.info("Application ready - scheduling actions according to config");
        scheduleNYT();
        scheduleGemini();
    }

    @PreDestroy
    public void shutdown() {
        executorService.shutdown();
    }

    private void scheduleNYT() {
        if(config.getNyt().isEnabled()) {
            executorService.schedule(this::fetchNewYorkTimes, config.getNyt().getFetchDelaySeconds(), TimeUnit.SECONDS);
            log.info("Scheduled NYT pipeline for {} seconds in the future", config.getNyt().getFetchDelaySeconds());
        } else {
            log.info("NYT fetch is disabled in config, skipping");
        }
    }

    private void scheduleGemini() {
        if(config.getGemini().isEnabled()) {
            executorService.schedule(this::fetchGemini, config.getGemini().getFetchDelaySeconds(), TimeUnit.SECONDS);
            log.info("Scheduled Gemini pipeline for {} seconds in the future", config.getGemini().getFetchDelaySeconds());
        } else {
            log.info("Gemini fetch is disabled in config, skipping");
        }
    }

}
