package uk.rossarnold.newschart.callout;

import uk.rossarnold.newschart.geo.Country;

/**
 * Represents the fields we want the external model to populate.  If we use the full Callout class
 * the LLM can invent its own enum values for source or type.
 */
public record LlmCallout(Country country, String headline, String detail, String extendedDetail) {
}
