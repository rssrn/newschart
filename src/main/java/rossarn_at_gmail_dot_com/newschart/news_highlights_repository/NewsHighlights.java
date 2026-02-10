package rossarn_at_gmail_dot_com.newschart.news_highlights_repository;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import rossarn_at_gmail_dot_com.newschart.callout_repository.CalloutSource;

import java.time.Instant;
import java.util.List;


@Document(collection = "news_highlights")
public class NewsHighlights {
    @Id
    private String id;

    private CalloutSource source;
    private Instant fetchTime;

    private List<CountryNews> newsItemsForCountry;

    public NewsHighlights(List<CountryNews> newsItemsForCountry) {
        this.newsItemsForCountry = newsItemsForCountry;
    }

    public String getId() {
        return id;
    }

    public CalloutSource getSource() {
        return source;
    }

    public Instant getFetchTime() {
        return fetchTime;
    }

    public void setSource(CalloutSource source) {
        this.source = source;
    }

    public void setFetchTime(Instant fetchTime) {
        this.fetchTime = fetchTime;
    }

    public List<CountryNews> getNewsItemsForCountry() {
        return newsItemsForCountry;
    }
}
