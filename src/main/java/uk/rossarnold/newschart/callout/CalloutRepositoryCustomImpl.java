package uk.rossarnold.newschart.callout;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.DateOperators;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class CalloutRepositoryCustomImpl implements CalloutRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    public CalloutRepositoryCustomImpl(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    record DayResult(@Field("_id") String day) {} // needed to unwrap MongoDB _id wrapper

    @Override
    public List<Callout> findCalloutsFiltered(Instant start, Instant end, CalloutSource source) {
        Query query = new Query();

        query.addCriteria(Criteria.where("generatedAt").gte(start).lt(end));

        if (source != null) {
            query.addCriteria(Criteria.where("source").is(source));
        }

        return mongoTemplate.find(query, Callout.class);
    }

    @Override
    public List<String> findDistinctDaysWithCallouts(CalloutSource source) {
        List<AggregationOperation> ops = new ArrayList<>();

        if (source != null) {
            ops.add(Aggregation.match(Criteria.where("source").is(source)));
        }

        ops.add(Aggregation.project()
                .and(DateOperators.DateToString
                        .dateOf("generatedAt")
                        .toString("%Y-%m-%d")
                        .withTimezone(DateOperators.Timezone.valueOf("UTC")))
                .as("dateStr"));
        ops.add(Aggregation.group("dateStr"));
        ops.add(Aggregation.sort(Sort.Direction.ASC, "_id"));

        Aggregation aggregation = Aggregation.newAggregation(ops);

        return mongoTemplate.aggregate(aggregation, Callout.class, DayResult.class)
                .getMappedResults()
                .stream()
                .map(DayResult::day)
                .toList();
    }
}
