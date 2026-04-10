package rossarn_at_gmail_dot_com.newschart.scheduler;

import jakarta.annotation.PreDestroy;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import rossarn_at_gmail_dot_com.newschart.news.pipeline.GeminiPipelineOrchestrator;
import rossarn_at_gmail_dot_com.newschart.news.pipeline.NytPipelineOrchestrator;

import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;


/***
 * Schedule to fetch from all our sources soon after startup
 */
@Component
public class BasicFetchSchedulerService extends BaseScheduler {

    private static final Logger log = LogManager.getLogger(BasicFetchSchedulerService.class);

    private final ScheduledThreadPoolExecutor executorService = new ScheduledThreadPoolExecutor(1);
    private final BasicFetchSchedulerConfig config;

    public BasicFetchSchedulerService(NytPipelineOrchestrator nytPipelineOrchestrator,
                                      GeminiPipelineOrchestrator geminiNewsPipelineOrchestrator,
                                      BasicFetchSchedulerConfig config) {
        super(nytPipelineOrchestrator, geminiNewsPipelineOrchestrator);
        this.config = config;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void applicationReady() {
        log.info("Application ready - scheduling initial fetches on startup");
        scheduleDefaultFetches();
    }

    @PreDestroy
    public void shutdown() {
        executorService.shutdown();
        try {
          if (!executorService.awaitTermination(60, TimeUnit.SECONDS)) {
              log.warn("Pipeline did not finish within shutdown timeout");
              executorService.shutdownNow();
          }
      } catch (InterruptedException e) {
          executorService.shutdownNow();
          Thread.currentThread().interrupt();
      }
    }

    @Scheduled(cron = "0 5 6 * * *")
    public void scheduledFetch() {
        log.info("Regular scheduled fetch");
        scheduleDefaultFetches();
    }

    private void scheduleDefaultFetches() {
        if (!executorService.getQueue().isEmpty()) {
            log.info("Fetch(es) already queued, skipping");
            return;
        }
        scheduleNYT();
        scheduleGemini();
    }

    private void scheduleNYT() {
        if(config.getNyt().isEnabled()) {
            executorService.schedule(() -> {
                try {
                    fetchNewYorkTimes();
                } catch (Exception e) {
                    log.error("NYT pipeline failed", e);
                }
            }, config.getNyt().getFetchDelaySeconds(), TimeUnit.SECONDS);
            log.info("Scheduled NYT pipeline for {} seconds in the future", config.getNyt().getFetchDelaySeconds());
        } else {
            log.info("NYT fetch is disabled in config, skipping");
        }
    }

    private void scheduleGemini() {
        if(config.getGemini().isEnabled()) {
            executorService.schedule(() -> {
                try {
                    fetchGemini();
                } catch (Exception e) {
                    log.error("Gemini pipeline failed", e);
                }
            }, config.getGemini().getFetchDelaySeconds(), TimeUnit.SECONDS);
            log.info("Scheduled Gemini pipeline for {} seconds in the future", config.getGemini().getFetchDelaySeconds());
        } else {
            log.info("Gemini fetch is disabled in config, skipping");
        }
    }

}
