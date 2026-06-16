package uk.rossarnold.newschart.callout;

import java.util.Date;
import java.util.List;

/**
 * Custom repository fragment for query methods that can't be expressed as derived
 * or {@code @Query}/{@code @Aggregation} methods. Implemented by
 * {@link CalloutRepositoryCustomImpl} and mixed into {@link CalloutRepository} via
 * Spring Data's fragment-interface convention.
 *
 * @author Claude Opus 4.8 Anthropic
 */
public interface CalloutRepositoryCustom {

    List<Callout> findCalloutsFiltered(Date start, Date end, CalloutSource source);

    List<String> findDistinctDaysWithCallouts(CalloutSource source);
}
