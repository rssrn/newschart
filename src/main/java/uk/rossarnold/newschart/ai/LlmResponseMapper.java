package uk.rossarnold.newschart.ai;

import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.module.SimpleModule;
import uk.rossarnold.newschart.geo.Country;
import uk.rossarnold.newschart.geo.CountryDeserializer;
import uk.rossarnold.newschart.geo.CountryFactory;

/**
 * Holds the {@link JsonMapper} used to bind LLM responses, which is deliberately separate from
 * the mapper Spring Boot uses for HTTP.
 * <p>
 * This is a holder rather than a {@code @Bean JsonMapper} on purpose: Boot auto-configures its
 * web {@code JsonMapper} with {@code @ConditionalOnMissingBean}, so publishing one of that type
 * here would silently take over API serialisation as well.
 *
 * @author Claude Opus 5 Anthropic
 */
@Component
public class LlmResponseMapper {

    private final JsonMapper mapper;

    public LlmResponseMapper(CountryFactory countryFactory) {
        SimpleModule module = new SimpleModule("llm-country-tolerance")
                .addDeserializer(Country.class, new CountryDeserializer(countryFactory));
        this.mapper = JsonMapper.builder().addModule(module).build();
    }

    public JsonMapper mapper() {
        return mapper;
    }
}
