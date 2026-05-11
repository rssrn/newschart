package uk.rossarnold.newschart.ai;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.stereotype.Service;
import uk.rossarnold.newschart.callout.Callout;
import uk.rossarnold.newschart.callout.CalloutType;
import uk.rossarnold.newschart.callout.LlmCallout;


import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class OpenRouterGatewayService {
    private final ChatClient chatClient;

    private static final Logger log = LogManager.getLogger(OpenRouterGatewayService.class);

    public OpenRouterGatewayService(OpenAiChatModel chatModel) {
        this.chatClient = ChatClient.create(chatModel);
    }

    // workaround so the required return format is unambiguous - bare list can confuse the LLM
    public record LlmCalloutList(List<LlmCallout> items) {}

    /**
     * Use LLM to generate top news stories for today.
     *
     * @return list of story callouts suggested by the LLM
     */
    public Optional<List<Callout>> getCallouts(String model) {
        log.info("Calling OpenRouter {}", model);

        // we need to manually parse the result rather than relying on spring entity mapping
        // because sometimes the llm adds additional text outside the json
        // and spring doesn't strip it automatically
        var converter = new BeanOutputConverter<>(LlmCalloutList.class);

        String raw = chatClient.prompt()
                .user(AiPrompts.FIND_NEWS_PROMPT + "\n" + converter.getFormat())
                .options(OpenAiChatOptions.builder()
                        .model(model))
                .call()
                .content();
        if (raw == null) {
            log.error("Got empty result from call to model {}", model);
            return Optional.empty();
        }

        LlmCalloutList result;
        try {
            result = converter.convert(extractJson(raw));
        } catch (Exception e) {
            log.error("Could not parse response from model {}: {}", model, e.getMessage());
            return Optional.empty();
        }

        log.info("Called model {} and received {} callouts", model, result.items().size());

        // The model returns the minimal object LlmCallout so it can't try to invent enums.
        // Now map it back to a canonical Callout object.
        return Optional.of(result.items().stream()
                .map(llm -> new Callout.Builder(Instant.now())
                        .country(llm.country())
                        .headline(llm.headline())
                        .detail(llm.detail())
                        .extendedDetail(llm.extendedDetail())
                        .type(CalloutType.NEWS)
                        .build())
                .toList());
    }

    private String extractJson(String raw) {
        String prefix = raw.substring(0, Math.min(raw.length(), 100));
        log.info("Extracting json from: {}", prefix);
        int start = raw.indexOf("```json");
        if (start != -1) {
            raw = raw.substring(start + 7);
            int end = raw.indexOf("```");
            if (end != -1) raw = raw.substring(0, end);
        }
        return raw.trim();
    }
}
