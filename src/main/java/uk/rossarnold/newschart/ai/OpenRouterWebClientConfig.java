package uk.rossarnold.newschart.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class OpenRouterWebClientConfig {

    @Bean
    public WebClient openRouterWebClient(
            WebClient.Builder builder,
            @Value("${spring.ai.openai.api-key:}") String apiKey) {
        return builder
                .baseUrl("https://openrouter.ai")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }
}
