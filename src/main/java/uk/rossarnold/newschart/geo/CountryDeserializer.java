package uk.rossarnold.newschart.geo;

import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.json.JsonMapper;

/**
 * Deserialises {@link Country} from either the full object the prompt asks for, or a bare
 * country name string.
 * <p>
 * Models are told to emit the full object (name plus ISO codes and centroid coordinates), and
 * usually do. Occasionally one collapses the field to just the name — on 2026-09-01
 * perplexity/sonar-pro-search returned {@code "country": "Nepal"}, which failed to bind and
 * cost the whole day's Perplexity callouts. Resolving the name against {@link CountryFactory}
 * recovers an otherwise usable response.
 * <p>
 * The object branch delegates to a plain {@link JsonMapper} that has no knowledge of this
 * deserializer, which keeps the default bean binding intact without recursing back into here.
 *
 * @author Claude Opus 5 Anthropic
 */
public class CountryDeserializer extends ValueDeserializer<Country> {

    private final CountryFactory countryFactory;
    private final JsonMapper plainMapper = JsonMapper.builder().build();

    public CountryDeserializer(CountryFactory countryFactory) {
        this.countryFactory = countryFactory;
    }

    @Override
    public Country deserialize(JsonParser p, DeserializationContext ctxt) throws JacksonException {
        if (p.currentToken() == JsonToken.VALUE_STRING) {
            // Returns null for a name absent from the CSV (e.g. "Palestine", which is filed as
            // "Palestinian Territory"). Callers drop callouts with a null country rather than
            // failing the batch - see OpenRouterGatewayService.getCallouts.
            return countryFactory.getCountry(p.getString());
        }

        JsonNode node = ctxt.readTree(p);
        return plainMapper.treeToValue(node, Country.class);
    }
}
