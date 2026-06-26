package uk.rossarnold.newschart.ai.metadata;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface MetadataRepository extends MongoRepository<Metadata, String> {
}
