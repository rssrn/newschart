package rossarn_at_gmail_dot_com.newschart.controller;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsHighlightsService;
import rossarn_at_gmail_dot_com.newschart.view.ChartItemList;

import java.time.LocalDate;

@RestController
@RequestMapping("api/news")
public class NewsController {

    private static final Logger log = LogManager.getLogger(NewsController.class);

    @Autowired
    private final NewsHighlightsService newsHighlightsService;

    public NewsController() {
        newsHighlightsService = null;
    }

    @GetMapping("news/day/{date}")
    public ChartItemList NewsForDay(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Got request for date {}", date);
        return new ChartItemList();
    }
}
