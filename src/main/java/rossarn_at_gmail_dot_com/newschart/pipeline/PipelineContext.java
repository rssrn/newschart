package rossarn_at_gmail_dot_com.newschart.pipeline;

import rossarn_at_gmail_dot_com.newschart.callout_repository.StoryCallout;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsHighlights;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsItem;
import rossarn_at_gmail_dot_com.newschart.news_repository.NewsRss;

import java.util.List;

public class PipelineContext {

    private boolean failed = false;

    private NewsRss newsRss;
    private List<NewsItem> newsItems;
    private NewsHighlights newsHighlights;
    private List<StoryCallout> callouts;

    public NewsRss getNewsRss() {
        return newsRss;
    }

    public void setNewsRss(NewsRss newsRss) {
        this.newsRss = newsRss;
    }

    public List<NewsItem> getNewsItems() {
        return newsItems;
    }

    public void setNewsItems(List<NewsItem> newsItems) {
        this.newsItems = newsItems;
    }

    public NewsHighlights getNewsHighlights() {
        return newsHighlights;
    }

    public void setNewsHighlights(NewsHighlights newsHighlights) {
        this.newsHighlights = newsHighlights;
    }

    public boolean isFailed() {
        return failed;
    }

    public void setFailed(boolean failed) {
        this.failed = failed;
    }

    public List<StoryCallout> getCallouts() {
        return callouts;
    }

    public void setCallouts(List<StoryCallout> callouts) {
        this.callouts = callouts;
    }
}
