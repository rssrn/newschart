package rossarn_at_gmail_dot_com.newschart.news.source;

import org.springframework.resilience.annotation.Retryable;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

@HttpExchange("https://rss.nytimes.com/services/xml/rss/nyt/World.xml")
public interface NytRssClient {
    @GetExchange
    @Retryable(
            includes = RuntimeException.class,
            maxRetries = 4,
            delay = 1000,
            multiplier = 2,
            maxDelay = 10000)
    String fetchRss();
}
