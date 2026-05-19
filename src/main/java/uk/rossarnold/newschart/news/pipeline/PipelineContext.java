package uk.rossarnold.newschart.news.pipeline;

import uk.rossarnold.newschart.callout.CalloutSource;
import uk.rossarnold.newschart.callout.Callout;
import uk.rossarnold.newschart.news.highlights.NewsHighlights;
import uk.rossarnold.newschart.news.highlights.NewsItem;
import uk.rossarnold.newschart.news.NewsEntry;

import java.util.List;

public class PipelineContext {

    private boolean failed = false;
    private boolean skipped = false;

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

    public boolean isSkipped() {
        return skipped;
    }

    public void setSkipped(boolean skipped) {
        this.skipped = skipped;
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
