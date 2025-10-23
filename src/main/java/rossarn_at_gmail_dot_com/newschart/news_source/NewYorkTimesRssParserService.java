package rossarn_at_gmail_dot_com.newschart.news_source;


import rossarn_at_gmail_dot_com.newschart.geo.Country;
import rossarn_at_gmail_dot_com.newschart.geo.CountryFactory;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsItem;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.*;
import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;

@Service
public class NewYorkTimesRssParserService {

    private static final Logger log = LogManager.getLogger(NewYorkTimesRssParserService.class);

    private DocumentBuilder builder;
    private XPath xpath;
    private XPathExpression expr;

    private CountryFactory countryFactory;

    @Autowired
    public NewYorkTimesRssParserService(CountryFactory countryFactory) throws RuntimeException {
        this.countryFactory = countryFactory;

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true); // RSS often has namespaces
        try {
            builder = factory.newDocumentBuilder();
        } catch (ParserConfigurationException e) {
            throw new RuntimeException(e);
        }

        XPathFactory xPathFactory = XPathFactory.newInstance();
        xpath = xPathFactory.newXPath();
        try {
            expr = xpath.compile("/rss/channel/item");
        } catch (XPathExpressionException e) {
            throw new RuntimeException();
        }
    }

    public List<NewsItem> getNewsItems(NewsSource source, String blob) {
        List<NewsItem> result = new ArrayList<>();

        try {
            Document doc = builder.parse(new InputSource(new StringReader(blob)));
            NodeList items = (NodeList) expr.evaluate(doc, XPathConstants.NODESET);

            for (int i = 0; i < items.getLength(); i++) {
                Element item = (Element) items.item(i);
                String title = (String) xpath.evaluate("title/text()", item, XPathConstants.STRING);
                String link = (String) xpath.evaluate("link/text()", item, XPathConstants.STRING);
                String text = (String) xpath.evaluate("description/text()", item, XPathConstants.STRING);

                log.info("Title: {}", title);
                log.info("Link: {}", link);
                log.info("Text: {}", text);

                // iterate over nyt_geo elements to collect geo tags
                // note this can include multiple regions, countries, states, etc
                XPathExpression geoExpr = xpath.compile("category[@domain='http://www.nytimes.com/namespaces/keywords/nyt_geo']");
                NodeList geoNodes = (NodeList) geoExpr.evaluate(item, XPathConstants.NODESET);

                List<Country> countries = new ArrayList<>();
                for (int j = 0; j < geoNodes.getLength(); j++) {
                    Element geoEl = (Element) geoNodes.item(j);
                    log.info(" --> geo: {}", geoEl.getTextContent().trim());
                    String countryName = geoEl.getTextContent().trim();
                    if (countryFactory.isValidCountry(countryName)) {
                        countries.add(countryFactory.getCountry(countryName));
                    }
                }

                NewsItem newsItem = new NewsItem(source, title, link, text, countries);
                result.add(newsItem);
            }
        } catch (IOException e) {
            log.error("IO error parsing blob: {}", e.getMessage());
            return result;
        } catch (SAXException e) {
            log.error("SAX error parsing blob: {}", e.getMessage());
        } catch (XPathExpressionException e) {
            log.error("XPath expression error: {}", e.getMessage());
        }

        log.info("Parsed document OK");

        return result;
    }
}
