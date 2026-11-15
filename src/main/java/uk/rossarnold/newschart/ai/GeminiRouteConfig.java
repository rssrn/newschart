package uk.rossarnold.newschart.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Whether the Gemini source (callouts) and the primary story summariser call Google directly, or
 * reach the same Gemini models through OpenRouter. OpenRouter is the default: a direct key needs
 * its own billed Google project, which isn't worth the trouble for a demo site.
 *
 * @author Claude Opus 5.5 Anthropic
 */
@ConfigurationProperties(prefix = "gemini")
@Configuration
public class GeminiRouteConfig {

    public enum Route {DIRECT, OPENROUTER}

    private Route route = Route.OPENROUTER;

    // :online is what gives the model web search via OpenRouter - without it the callouts would
    // come from training data rather than today's news
    private String openrouterCalloutsModel = "google/gemini-2.5-flash:online";
    private String openrouterSummaryModel = "google/gemini-2.5-flash-lite";

    public boolean viaOpenRouter() { return route == Route.OPENROUTER; }

    public Route getRoute() { return route; }
    public void setRoute(Route route) { this.route = route; }

    public String getOpenrouterCalloutsModel() { return openrouterCalloutsModel; }
    public void setOpenrouterCalloutsModel(String openrouterCalloutsModel) { this.openrouterCalloutsModel = openrouterCalloutsModel; }

    public String getOpenrouterSummaryModel() { return openrouterSummaryModel; }
    public void setOpenrouterSummaryModel(String openrouterSummaryModel) { this.openrouterSummaryModel = openrouterSummaryModel; }
}
