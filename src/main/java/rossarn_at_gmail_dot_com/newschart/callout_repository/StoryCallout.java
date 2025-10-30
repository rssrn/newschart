package rossarn_at_gmail_dot_com.newschart.callout_repository;

import rossarn_at_gmail_dot_com.newschart.geo.Country;
import rossarn_at_gmail_dot_com.newschart.view.LatLong;

import java.time.Instant;

/**
 * Represents one story presented for user consumption.  As it is geo tagged, naming it as Callout
 * although the frontend could choose to display it in some other way.
 */
public class StoryCallout {
    private Country country;
    private String headline;
    private String detail;
    private LatLong latLong;
    private CalloutType type;
    private CalloutSource source;
    private Instant generatedAt;

    private StoryCallout() {
        // for MongoDB deserialization
    }

    private StoryCallout(Builder builder) {
        this.country = builder.country;
        this.headline = builder.headline;
        this.detail = builder.detail;
        this.latLong = builder.latLong;
        this.type = builder.type;
        this.source = builder.source;
        this.generatedAt = builder.generatedAt;
    }

    public static class Builder {
        private Country country;
        private String headline;
        private String detail;
        private LatLong latLong;
        private CalloutType type;
        private CalloutSource source;
        private Instant generatedAt;

        public Builder(Instant generatedAt) {
            this.generatedAt = generatedAt;
        }

        public Builder country(Country country) {
            this.country = country;
            return this;
        }

        public Builder headline(String headline) {
            this.headline = headline;
            return this;
        }

        public Builder detail(String detail) {
            this.detail = detail;
            return this;
        }

        public Builder latLong(LatLong latLong) {
            this.latLong = latLong;
            return this;
        }

        public Builder type(CalloutType type) {
            this.type = type;
            return this;
        }

        public Builder source(CalloutSource source) {
            this.source = source;
            return this;
        }

        public StoryCallout build() {
            return new StoryCallout(this);
        }


    }

    public Country getCountry() {
        return country;
    }

    public String getHeadline() {
        return headline;
    }

    public String getDetail() {
        return detail;
    }

    public LatLong getLatLong() {
        return latLong;
    }

    public CalloutType getType() {
        return type;
    }

    public CalloutSource getSource() {
        return source;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setCountry(Country country) {
        this.country = country;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }

    public void setLatLong(LatLong latLong) {
        this.latLong = latLong;
    }

    public void setType(CalloutType type) {
        this.type = type;
    }

    public void setSource(CalloutSource source) {
        this.source = source;
    }
}
