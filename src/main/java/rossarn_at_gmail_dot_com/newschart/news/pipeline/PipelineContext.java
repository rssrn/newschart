package rossarn_at_gmail_dot_com.newschart.news.pipeline;

import rossarn_at_gmail_dot_com.newschart.callout.CalloutSource;
import rossarn_at_gmail_dot_com.newschart.callout.Callout;
import rossarn_at_gmail_dot_com.newschart.news.highlights.NewsHighlights;
import rossarn_at_gmail_dot_com.newschart.news.highlights.NewsItem;
import rossarn_at_gmail_dot_com.newschart.news.NewsEntry;

import java.util.List;

public class PipelineContext {

    private boolean failed = false;

    private NewsEntry newsRss;
    private List<NewsItem> newsItems;
    private NewsHighlights newsHighlights;
    private List<Callout> callouts;
    private CalloutSource calloutSource;
    private String model;

    public NewsEntry getNewsEntry() {
        return newsRss;
    }

    public void setNewsEntry(NewsEntry newsRss) {
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

    public List<Callout> getCallouts() {
        return callouts;
    }

    public void setCallouts(List<Callout> callouts) {
        this.callouts = callouts;
    }

    public CalloutSource getCalloutSource() {
        return calloutSource;
    }

    public void setCalloutSource(CalloutSource calloutSource) {
        this.calloutSource = calloutSource;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }
}
