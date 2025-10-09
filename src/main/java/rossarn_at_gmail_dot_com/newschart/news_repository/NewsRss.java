package rossarn_at_gmail_dot_com.newschart.news_repository;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import rossarn_at_gmail_dot_com.newschart.news_source.NewsSource;

import java.time.Instant;

@Document(collection = "newsrss")
public class NewsRss {
    @Id
    private String id;

    private NewsSource source;
    private Instant creationTime;
    private String blob;

    private static final String idSeparator = "_";

    public NewsRss(String blob, NewsSource source) {
        this.blob = blob;
        this.source = source;
        this.creationTime = Instant.now();

        // TODO: more thought needed on building the ID
        this.id = source.name() + idSeparator + creationTime.toEpochMilli();
    }
}
