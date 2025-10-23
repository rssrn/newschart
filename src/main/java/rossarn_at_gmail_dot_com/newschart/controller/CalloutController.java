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
import rossarn_at_gmail_dot_com.newschart.view.StoryCallout;
import rossarn_at_gmail_dot_com.newschart.view.ChartItemList;
import rossarn_at_gmail_dot_com.newschart.view.LatLong;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("api/news")
public class CalloutController {

    private static final Logger log = LogManager.getLogger(CalloutController.class);

    private int currentTestCase = 0;

    private final NewsHighlightsService newsHighlightsService;

    @Autowired
    public CalloutController(NewsHighlightsService newsHighlightsService) {
        this.newsHighlightsService = newsHighlightsService;
    }

    @GetMapping("news/day/{date}")
    public ChartItemList newsForDay(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Got request for date {}", date);
        return new ChartItemList();
    }

    @GetMapping("sampleCalloutsSingle")
    public List<StoryCallout> sampleCalloutsSingle() {
        log.info("Got request for sample callout");
        return List.of(
                new StoryCallout(
                        "Louvre Jewel Heist",
                        "The investigation continues into a major jewel heist at the Louvre Museum in Paris" +
                                "where crown jewels valued at over $100 million were stolen in a daring daylight robbery. " +
                                "Authorities are conducting a massive manhunt for the thieves and the stolen pieces.",
                        new LatLong(48.8566, 2.3522))
                ,
                new StoryCallout(
                        "Japan Elects First Female PM",
                        "Takaichi, a conservative figure, was officially confirmed by the parliament, taking on " +
                                "the role of Japan's first woman Prime Minister amidst challenges that include a " +
                                "struggling economy and internal political maneuvering.",
                        new LatLong(36, 138))
                ,
                new StoryCallout(
                        "King Charles Meets Pope: History",
                        "King Charles III of the United Kingdom, as head of the Church of England, began " +
                                "a state visit to the Vatican where he is set to meet Pope Leo XIV and make " +
                                "history by being the first British monarch to pray publicly with the head of " +
                                "the Catholic Church since the split of the churches five centuries ago.",
                        new LatLong(41.9, 12.45))
        );
    }

    /**
     * Cycle through some predefined static examples - mainly used for testing layout algorithms.
     *
     * @author Claude Sonnet 4.5 Anthropic
     * @return json for one sample callout
     */
    @GetMapping("sampleCallouts")
    public String sampleCallouts() {
        String[] testCases = {
                // Test 0: Original Europe/Asia
                """
            [
                {
                    "headline": "Louvre Jewel Heist",
                    "detail": "The investigation continues into a major jewel heist at the Louvre Museum in Pariswhere crown jewels valued at over $100 million were stolen in a daring daylight robbery. Authorities are conducting a massive manhunt for the thieves and the stolen pieces.",
                    "latLong": {
                        "latitude": 48.8566,
                        "longitude": 2.3522
                    }
                },
                {
                    "headline": "Japan Elects First Female PM",
                    "detail": "Takaichi, a conservative figure, was officially confirmed by the parliament, taking on the role of Japan's first woman Prime Minister amidst challenges that include a struggling economy and internal political maneuvering.",
                    "latLong": {
                        "latitude": 36.0,
                        "longitude": 138.0
                    }
                },
                {
                    "headline": "King Charles Meets Pope: History",
                    "detail": "King Charles III of the United Kingdom, as head of the Church of England, began a state visit to the Vatican where he is set to meet Pope Leo XIV and make history by being the first British monarch to pray publicly with the head of the Catholic Church since the split of the churches five centuries ago.",
                    "latLong": {
                        "latitude": 41.9,
                        "longitude": 12.45
                    }
                }
            ]
            """,

                // Test 1: Wide geographic spread
                """
            [
                {
                    "headline": "Sydney Opera House Renovation",
                    "detail": "A major renovation project begins at the iconic Sydney Opera House, including modernization of acoustics and accessibility features.",
                    "latLong": {
                        "latitude": -33.8568,
                        "longitude": 151.2153
                    }
                },
                {
                    "headline": "Amazon Rainforest Conservation",
                    "detail": "Brazil announces new protected zones in the Amazon rainforest as part of international climate commitments.",
                    "latLong": {
                        "latitude": -3.4653,
                        "longitude": -62.2159
                    }
                },
                {
                    "headline": "Cairo Museum Discovery",
                    "detail": "Archaeologists unveil newly discovered artifacts from an unopened tomb near the pyramids of Giza.",
                    "latLong": {
                        "latitude": 30.0444,
                        "longitude": 31.2357
                    }
                },
                {
                    "headline": "Vancouver Climate Summit",
                    "detail": "World leaders gather in Vancouver for emergency climate talks following record-breaking weather events.",
                    "latLong": {
                        "latitude": 49.2827,
                        "longitude": -123.1207
                    }
                }
            ]
            """,

                // Test 2: Tight US cluster
                """
            [
                {
                    "headline": "NYC Stock Market Surge",
                    "detail": "Wall Street sees biggest gains in a decade as tech sector leads market rally.",
                    "latLong": {
                        "latitude": 40.7128,
                        "longitude": -74.0060
                    }
                },
                {
                    "headline": "Boston Tech Breakthrough",
                    "detail": "MIT researchers announce quantum computing breakthrough with potential applications in medicine.",
                    "latLong": {
                        "latitude": 42.3601,
                        "longitude": -71.0589
                    }
                },
                {
                    "headline": "Philadelphia Sports Victory",
                    "detail": "Philadelphia celebrates championship win as fans flood the streets in jubilation.",
                    "latLong": {
                        "latitude": 39.9526,
                        "longitude": -75.1652
                    }
                },
                {
                    "headline": "Washington Policy Shift",
                    "detail": "Congress passes landmark legislation affecting national infrastructure spending.",
                    "latLong": {
                        "latitude": 38.9072,
                        "longitude": -77.0369
                    }
                }
            ]
            """,

                // Test 3: Asian cluster with outlier
                """
            [
                {
                    "headline": "Tokyo Olympics Announcement",
                    "detail": "Japan unveils plans for sustainable Olympics with carbon-neutral venues and public transportation.",
                    "latLong": {
                        "latitude": 35.6762,
                        "longitude": 139.6503
                    }
                },
                {
                    "headline": "Seoul Tech Innovation",
                    "detail": "South Korea launches world's first nationwide 6G network trial.",
                    "latLong": {
                        "latitude": 37.5665,
                        "longitude": 126.9780
                    }
                },
                {
                    "headline": "Beijing Space Program",
                    "detail": "China announces ambitious plans for permanent lunar research station by 2030.",
                    "latLong": {
                        "latitude": 39.9042,
                        "longitude": 116.4074
                    }
                },
                {
                    "headline": "Mumbai Monsoon Crisis",
                    "detail": "Record rainfall causes flooding in Mumbai as climate experts call for urgent infrastructure upgrades.",
                    "latLong": {
                        "latitude": 19.0760,
                        "longitude": 72.8777
                    }
                }
            ]
            """,

                // Test 4: Southern hemisphere mix
                """
            [
                {
                    "headline": "Cape Town Water Innovation",
                    "detail": "South Africa pioneers desalination technology to address water scarcity issues.",
                    "latLong": {
                        "latitude": -33.9249,
                        "longitude": 18.4241
                    }
                },
                {
                    "headline": "Buenos Aires Cultural Festival",
                    "detail": "Argentina hosts largest tango festival in history with performers from 50 countries.",
                    "latLong": {
                        "latitude": -34.6037,
                        "longitude": -58.3816
                    }
                },
                {
                    "headline": "Wellington Climate Leadership",
                    "detail": "New Zealand becomes first carbon-negative developed nation, setting global example.",
                    "latLong": {
                        "latitude": -41.2865,
                        "longitude": 174.7762
                    }
                }
            ]
            """,

                // Test 5: Single location
                """
            [
                {
                    "headline": "London Financial Hub",
                    "detail": "Major changes to banking regulations announced in the City of London.",
                    "latLong": {
                        "latitude": 51.5074,
                        "longitude": -0.1278
                    }
                }
            ]
            """
        };

        String result = testCases[currentTestCase];


        log.info("currentTestCase {}; testCases.length {}", currentTestCase, testCases.length);

        currentTestCase++;
        if (currentTestCase >= testCases.length) {
            currentTestCase = 0;
        }

        return result;
    }
}
