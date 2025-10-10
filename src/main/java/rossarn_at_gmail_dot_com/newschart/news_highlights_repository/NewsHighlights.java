package rossarn_at_gmail_dot_com.newschart.news_highlights_repository;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import rossarn_at_gmail_dot_com.newschart.news_repository.NewsRss;
import rossarn_at_gmail_dot_com.newschart.news_source.NewsSource;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Document(collection = "news_highlights")
public class NewsHighlights {
    @Id
    private final String id;

    private final NewsSource source;
    private final Instant fetchTime;

    private Map<String, List<NewsItem>> newsItemsForCountry;

    private static final String idSeparator = "_";

    public NewsHighlights(NewsRss newsRss) {
        this.source = newsRss.getSource();
        this.fetchTime = newsRss.getFetchTime();

        this.id = generateId();
    }

    private String generateId() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd")
                                                       .withZone(ZoneOffset.UTC);
        return source.name() + idSeparator + formatter.format(fetchTime);
    }

    public String getId() {
        return id;
    }
}
