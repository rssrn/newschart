package rossarn_at_gmail_dot_com.newschart.view;

/**
 * Represents one story presented for user consumption.  As it is geo tagged, naming it as Callout
 * although the frontend could choose to display it in some other way.
 */
public class StoryCallout {
    private String headline;
    private String detail;
    private LatLong latLong;

    public StoryCallout(String headline, String detail, LatLong latLong) {
        this.headline = headline;
        this.detail = detail;
        this.latLong = latLong;
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
}
