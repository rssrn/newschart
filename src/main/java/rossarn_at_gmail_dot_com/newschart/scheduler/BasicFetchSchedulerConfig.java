package rossarn_at_gmail_dot_com.newschart.scheduler;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@ConfigurationProperties(prefix = "newschart.dev")
@Configuration
public class BasicFetchSchedulerConfig {
    private SourceConfig nyt = new SourceConfig(true, 5);
    private SourceConfig gemini = new SourceConfig(true, 10);

    public SourceConfig getNyt() { return nyt; }
    public void setNyt(SourceConfig nyt) { this.nyt = nyt; }

    public SourceConfig getGemini() { return gemini; }
    public void setGemini(SourceConfig bbc) { this.gemini = bbc; }

    public static class SourceConfig {
        private boolean enabled;
        private int fetchDelaySeconds;

        public SourceConfig(boolean enabled, int fetchDelaySeconds) {
            this.enabled = enabled;
            this.fetchDelaySeconds = fetchDelaySeconds;
        }

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }

        public int getFetchDelaySeconds() { return fetchDelaySeconds; }
        public void setFetchDelaySeconds(int fetchDelaySeconds) {
            this.fetchDelaySeconds = fetchDelaySeconds;
        }
    }
}
