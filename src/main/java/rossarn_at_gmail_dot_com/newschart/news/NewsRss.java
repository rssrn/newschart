package rossarn_at_gmail_dot_com.newschart.news;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import rossarn_at_gmail_dot_com.newschart.callout.CalloutSource;

import java.time.Instant;

@Document(collection = "news_rss")
public class NewsRss {
    @Id
    private String id;

    private final CalloutSource source;
    private final Instant fetchTime;
    private final String blob;

    public NewsRss(String blob, CalloutSource source) {
        this.blob = blob;
        this.source = source;
        this.fetchTime = Instant.now();
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

    public String getBlob() {
        return blob;
    }
}
