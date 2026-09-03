package uk.rossarnold.newschart.ai;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.core.io.DefaultResourceLoader;
import uk.rossarnold.newschart.geo.Country;
import uk.rossarnold.newschart.geo.CountryFactory;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Covers the tolerant country binding added after perplexity/sonar-pro-search returned
 * {@code "country": "Nepal"} on 2026-09-01 and the whole day's callouts were discarded.
 *
 * @author Claude Opus 5 Anthropic
 */
class LlmResponseMapperTest {

    private static LlmResponseMapper llmResponseMapper;

    @BeforeAll
    static void setUp() throws IOException {
        CountryFactory countryFactory = new CountryFactory(new DefaultResourceLoader());
        countryFactory.init();
        llmResponseMapper = new LlmResponseMapper(countryFactory);
    }

    private OpenRouterGatewayService.LlmCalloutList parse(String json) {
        return llmResponseMapper.mapper().readValue(json, OpenRouterGatewayService.LlmCalloutList.class);
    }

    // === bare string country (the 2026-09-01 failure) ===

    @Test
    void bindsCountryGivenAsABareName() {
        var result = parse("""
                {"items":[{"country":"Nepal","headline":"H","detail":"D","extendedDetail":"E"}]}
                """);

        Country country = result.items().getFirst().country();
        assertNotNull(country, "bare country name should resolve via CountryFactory");
        assertEquals("Nepal", country.getName());
        assertEquals("NP", country.getIso2());
        assertEquals("524", country.getIsoNumeric());
        assertTrue(country.getLatitude() > 26 && country.getLatitude() < 31,
                "should take the centroid latitude from the CSV, got " + country.getLatitude());
    }

    @Test
    void yieldsNullForACountryNameNotInTheCsv() {
        // The CSV files this as "Palestinian Territory", so the exact-match lookup misses.
        // Callers drop the callout rather than failing the batch.
        var result = parse("""
                {"items":[{"country":"Palestine","headline":"H","detail":"D","extendedDetail":"E"}]}
                """);

        assertNull(result.items().getFirst().country());
    }

    // === full object country (what models normally send) ===

    @Test
    void stillBindsCountryGivenAsTheFullObject() {
        var result = parse("""
                {"items":[{"country":{"iso2":"NP","isoNumeric":"524","latitude":28.3949,
                "longitude":84.124,"name":"Nepal"},"headline":"H","detail":"D","extendedDetail":"E"}]}
                """);

        Country country = result.items().getFirst().country();
        assertNotNull(country);
        assertEquals("Nepal", country.getName());
        assertEquals("NP", country.getIso2());
        // the model's own coordinates must survive, not be replaced by the CSV centroid
        assertEquals(28.3949, country.getLatitude(), 0.00001);
        assertEquals(84.124, country.getLongitude(), 0.00001);
    }

    @Test
    void bindsAMixOfBothShapesInOneResponse() {
        var result = parse("""
                {"items":[
                  {"country":"Nepal","headline":"A","detail":"D","extendedDetail":"E"},
                  {"country":{"iso2":"IL","isoNumeric":"376","latitude":31.5,"longitude":35.0,
                   "name":"Israel"},"headline":"B","detail":"D","extendedDetail":"E"}
                ]}
                """);

        assertEquals(2, result.items().size());
        assertEquals("Nepal", result.items().get(0).country().getName());
        assertEquals("Israel", result.items().get(1).country().getName());
        assertEquals(31.5, result.items().get(1).country().getLatitude(), 0.00001);
    }

    // === the schema sent to the model must not change ===

    @Test
    @SuppressWarnings("unchecked")
    void schemaStillAsksModelsForTheFullCountryObject() {
        // The converter's schema is appended to the prompt for every OpenRouter model. If the
        // tolerant binding leaked into schema generation we would start asking all five models
        // for a bare string, and lose the coordinates the four working ones supply today.
        var converter = new BeanOutputConverter<>(
                OpenRouterGatewayService.LlmCalloutList.class, llmResponseMapper.mapper());

        Map<String, Object> schema = converter.getJsonSchemaMap();
        Map<String, Object> properties = (Map<String, Object>) schema.get("properties");
        Map<String, Object> items = (Map<String, Object>) properties.get("items");
        Map<String, Object> itemSchema = (Map<String, Object>) items.get("items");
        Map<String, Object> itemProperties = (Map<String, Object>) itemSchema.get("properties");
        Map<String, Object> countrySchema = (Map<String, Object>) itemProperties.get("country");

        assertEquals("object", countrySchema.get("type"),
                "country must still be described as an object: " + converter.getJsonSchema());

        Map<String, Object> countryProperties = (Map<String, Object>) countrySchema.get("properties");
        assertTrue(countryProperties.keySet()
                        .containsAll(java.util.List.of("latitude", "longitude", "name", "iso2", "isoNumeric")),
                "country schema lost fields, got " + countryProperties.keySet());
    }
}
