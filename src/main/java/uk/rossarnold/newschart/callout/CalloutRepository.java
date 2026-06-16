package uk.rossarnold.newschart.callout;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalloutRepository extends MongoRepository<Callout, String>, CalloutRepositoryCustom {

    @Aggregation(pipeline = {
            // group by source and country code
            "{ $group: { " +
                    "_id: { source: '$source', countryCode: '$country.iso2' }, " +
                    "count: { $sum: 1 } " +
                    "} }",

            // flatten the _id object so fields map to the DTO
            "{ $project: { " +
                    "_id: 0, " +
                    "source: '$_id.source', " +
                    "countryCode: '$_id.countryCode', " +
                    "count: '$count' " +
                    "} }",

            // sort by source and countryCode
            "{ $sort: { source: 1, countryCode: 1 } }"
    })
    List<CalloutStats> findStatsFromAllCallouts();

    Optional<Callout> findFirstByGeneratedAtBetweenAndSourceOrderByGeneratedAtAsc(Instant start, Instant end, CalloutSource source);

    Page<Callout> findBySourceAndCountryIso2(CalloutSource source, String countryIso2, Pageable pageable);
}
