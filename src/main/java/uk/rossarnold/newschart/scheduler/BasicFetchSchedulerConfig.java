package uk.rossarnold.newschart.scheduler;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import uk.rossarnold.newschart.callout.CalloutSource;

import java.util.List;

@ConfigurationProperties(prefix = "newschart")
@Configuration
public class BasicFetchSchedulerConfig {
    private SourceConfig nyt = new SourceConfig(true, 5);
    private SourceConfig gemini = new SourceConfig(true, 10);
    private List<OpenRouterConfig> openRouterConfigs;

    public SourceConfig getNyt() { return nyt; }
    public void setNyt(SourceConfig nyt) { this.nyt = nyt; }

    public SourceConfig getGemini() { return gemini; }
    public void setGemini(SourceConfig gemini) { this.gemini = gemini; }

    public List<OpenRouterConfig> getOpenRouterConfigs() {
        return openRouterConfigs;
    }

    public void setOpenRouterConfigs(List<OpenRouterConfig> openRouterConfigs) {
        this.openRouterConfigs = openRouterConfigs;
    }

    public record SourceConfig (boolean enabled, int fetchDelaySeconds){
    }

    public record OpenRouterConfig (CalloutSource source, String model, boolean enabled, int fetchDelaySeconds){
    }
}
