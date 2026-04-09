package rossarn_at_gmail_dot_com.newschart.api;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import rossarn_at_gmail_dot_com.newschart.callout.CalloutService;
import rossarn_at_gmail_dot_com.newschart.callout.CalloutSource;
import rossarn_at_gmail_dot_com.newschart.callout.Callout;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("api/news")
public class CalloutController {

    private static final Logger log = LogManager.getLogger(CalloutController.class);

    private final CalloutService calloutService;

    @Autowired
    public CalloutController(CalloutService calloutService) {
        this.calloutService = calloutService;
    }

    @GetMapping("calloutsForDay/{date}")
    public List<Callout> calloutsForDay (
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestParam(required = false, defaultValue = "NEW_YORK_TIMES") CalloutSource source) {
        log.info("calloutsForDay {} {}", date, source);

        return calloutService.calloutsForDay(date, source);
    }

    @GetMapping("availableDays")
    public List<LocalDate> availableDays (
            @RequestParam(required = true) CalloutSource source) {
        log.info("availableDays {}", source);

        return calloutService.availableDays(source);
    }

    /**
     * Return predefined static examples - mainly used for testing layout algorithms.
     *
     * @author Claude Sonnet 4.5 Anthropic
     * @author Claude Opus 4.5 Anthropic (added testCase parameter)
     * @param testCase the test case number (0-5), defaults to 0
     * @return json for sample callouts
     */
    @GetMapping("sampleCallouts")
    public String sampleCallouts(@org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int testCase) {
        String[] testCases = {
                // Test 0: Original Europe/Asia
                """
        [
            {
                "headline": "Louvre Jewel Heist",
                "detail": "The investigation continues into a major jewel heist at the Louvre Museum in Pariswhere crown jewels valued at over $100 million were stolen in a daring daylight robbery. Authorities are conducting a massive manhunt for the thieves and the stolen pieces.",
                "country": {
                    "latitude": 48.8566,
                    "longitude": 2.3522,
                    "name": "France",
                    "iso2": "FR"
                }
            },
            {
                "headline": "Japan Elects First Female PM",
                "detail": "Takaichi, a conservative figure, was officially confirmed by the parliament, taking on the role of Japan's first woman Prime Minister amidst challenges that include a struggling economy and internal political maneuvering.",
                "country": {
                    "latitude": 36.0,
                    "longitude": 138.0,
                    "name": "Japan",
                    "iso2": "JP"
                }
            },
            {
                "headline": "King Charles Meets Pope: History",
                "detail": "King Charles III of the United Kingdom, as head of the Church of England, began a state visit to the Vatican where he is set to meet Pope Leo XIV and make history by being the first British monarch to pray publicly with the head of the Catholic Church since the split of the churches five centuries ago.",
                "country": {
                    "latitude": 41.9,
                    "longitude": 12.45,
                    "name": "Vatican City",
                    "iso2": "VA"
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
                "country": {
                    "latitude": -33.8568,
                    "longitude": 151.2153,
                    "name": "Australia",
                    "iso2": "AU"
                }
            },
            {
                "headline": "Amazon Rainforest Conservation",
                "detail": "Brazil announces new protected zones in the Amazon rainforest as part of international climate commitments.",
                "country": {
                    "latitude": -3.4653,
                    "longitude": -62.2159,
                    "name": "Brazil",
                    "iso2": "BR"
                }
            },
            {
                "headline": "Cairo Museum Discovery",
                "detail": "Archaeologists unveil newly discovered artifacts from an unopened tomb near the pyramids of Giza.",
                "country": {
                    "latitude": 30.0444,
                    "longitude": 31.2357,
                    "name": "Egypt",
                    "iso2": "EG"
                }
            },
            {
                "headline": "Vancouver Climate Summit",
                "detail": "World leaders gather in Vancouver for emergency climate talks following record-breaking weather events.",
                "country": {
                    "latitude": 49.2827,
                    "longitude": -123.1207,
                    "name": "Canada",
                    "iso2": "CA"
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
                "country": {
                    "latitude": 40.7128,
                    "longitude": -74.0060,
                    "name": "United States",
                    "iso2": "US"
                }
            },
            {
                "headline": "Boston Tech Breakthrough",
                "detail": "MIT researchers announce quantum computing breakthrough with potential applications in medicine.",
                "country": {
                    "latitude": 42.3601,
                    "longitude": -71.0589,
                    "name": "United States",
                    "iso2": "US"
                }
            },
            {
                "headline": "Philadelphia Sports Victory",
                "detail": "Philadelphia celebrates championship win as fans flood the streets in jubilation.",
                "country": {
                    "latitude": 39.9526,
                    "longitude": -75.1652,
                    "name": "United States",
                    "iso2": "US"
                }
            },
            {
                "headline": "Washington Policy Shift",
                "detail": "Congress passes landmark legislation affecting national infrastructure spending.",
                "country": {
                    "latitude": 38.9072,
                    "longitude": -77.0369,
                    "name": "United States",
                    "iso2": "US"
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
                "country": {
                    "latitude": 35.6762,
                    "longitude": 139.6503,
                    "name": "Japan",
                    "iso2": "JP"
                }
            },
            {
                "headline": "Seoul Tech Innovation",
                "detail": "South Korea launches world's first nationwide 6G network trial.",
                "country": {
                    "latitude": 37.5665,
                    "longitude": 126.9780,
                    "name": "South Korea",
                    "iso2": "KR"
                }
            },
            {
                "headline": "Beijing Space Program",
                "detail": "China announces ambitious plans for permanent lunar research station by 2030.",
                "country": {
                    "latitude": 39.9042,
                    "longitude": 116.4074,
                    "name": "China",
                    "iso2": "CN"
                }
            },
            {
                "headline": "Mumbai Monsoon Crisis",
                "detail": "Record rainfall causes flooding in Mumbai as climate experts call for urgent infrastructure upgrades.",
                "country": {
                    "latitude": 19.0760,
                    "longitude": 72.8777,
                    "name": "India",
                    "iso2": "IN"
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
                "country": {
                    "latitude": -33.9249,
                    "longitude": 18.4241,
                    "name": "South Africa",
                    "iso2": "ZA"
                }
            },
            {
                "headline": "Buenos Aires Cultural Festival",
                "detail": "Argentina hosts largest tango festival in history with performers from 50 countries.",
                "country": {
                    "latitude": -34.6037,
                    "longitude": -58.3816,
                    "name": "Argentina",
                    "iso2": "AR"
                }
            },
            {
                "headline": "Wellington Climate Leadership",
                "detail": "New Zealand becomes first carbon-negative developed nation, setting global example.",
                "country": {
                    "latitude": -41.2865,
                    "longitude": 174.7762,
                    "name": "New Zealand",
                    "iso2": "NZ"
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
                "country": {
                    "latitude": 51.5074,
                    "longitude": -0.1278,
                    "name": "United Kingdom",
                    "iso2": "GB"
                }
            }
        ]
        """
        };

        // Clamp testCase to valid range
        int index = Math.clamp(testCase, 0, testCases.length - 1);

        log.info("sampleCallouts testCase={}", index);

        return testCases[index];
    }
}
