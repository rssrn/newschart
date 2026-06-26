package uk.rossarnold.newschart.ai.metadata;

import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "ai_metadata")
public class Metadata {
    private String id;
    private Double costUsd;
    private String model;
    private Instant responseReceivedAt;

    public Metadata() {}

    public Metadata(String id, Double costUsd, String model, Instant responseReceivedAt) {
        this.id = id;
        this.costUsd = costUsd;
        this.model = model;
        this.responseReceivedAt = responseReceivedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Double getCostUsd() {
        return costUsd;
    }

    public void setCostUsd(Double costUsd) {
        this.costUsd = costUsd;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Instant getResponseReceivedAt() {
        return responseReceivedAt;
    }

    public void setResponseReceivedAt(Instant responseReceivedAt) {
        this.responseReceivedAt = responseReceivedAt;
    }
}
