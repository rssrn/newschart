package rossarn_at_gmail_dot_com.newschart.ai;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.stereotype.Service;
import rossarn_at_gmail_dot_com.newschart.callout.Callout;


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
    public record CalloutList(List<Callout> items) {}

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
        var converter = new BeanOutputConverter<>(CalloutList.class);

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

        CalloutList result;
        try {
            result = converter.convert(extractJson(raw));
        } catch (Exception e) {
            log.error("Could not parse response from model {}: {}", model, e.getMessage());
            return Optional.empty();
        }

        log.info("Called model {} and received {} callouts", model, result.items().size());

        return Optional.of(result.items());
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
