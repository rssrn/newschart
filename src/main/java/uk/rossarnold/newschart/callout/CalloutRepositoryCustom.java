package uk.rossarnold.newschart.callout;

import java.time.Instant;
import java.util.List;

/**
 * Custom repository fragment for query methods that can't be expressed as derived
 * or {@code @Query}/{@code @Aggregation} methods. Implemented by
 * {@link CalloutRepositoryCustomImpl} and mixed into {@link CalloutRepository} via
 * Spring Data's fragment-interface convention.
 *
 */
public interface CalloutRepositoryCustom {

    List<Callout> findCalloutsFiltered(Instant start, Instant end, CalloutSource source);

    List<String> findDistinctDaysWithCallouts(CalloutSource source);
}
