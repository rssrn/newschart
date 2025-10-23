package rossarn_at_gmail_dot_com.newschart.news_highlights_repository;

import rossarn_at_gmail_dot_com.newschart.geo.Country;

import java.util.List;

public class CountryNews {
    private Country country;
    private List<NewsItem> newsItems;

    public CountryNews(Country country, List<NewsItem> newsItems) {
        this.country = country;
        this.newsItems = newsItems;
    }

    public Country getCountry() {
        return country;
    }

    public List<NewsItem> getNewsItems() {
        return newsItems;
    }
}
