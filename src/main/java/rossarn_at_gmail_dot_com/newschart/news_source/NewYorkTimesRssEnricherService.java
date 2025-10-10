package rossarn_at_gmail_dot_com.newschart.news_source;


import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsHighlights;
import rossarn_at_gmail_dot_com.newschart.news_highlights_repository.NewsHighlightsService;
import rossarn_at_gmail_dot_com.newschart.news_repository.NewsRss;

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

@Service
public class NewYorkTimesRssEnricherService {

    private static final Logger log = LogManager.getLogger(NewYorkTimesRssEnricherService.class);

    private static DocumentBuilder builder;
    private static XPath xpath;
    private static XPathExpression expr;

    @Autowired
    private NewsHighlightsService newsHighlightsService;

    public NewYorkTimesRssEnricherService() throws RuntimeException {
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

    public void process(NewsRss newsRss) {
        log.info("Processing " + newsRss.getId());

        NewsHighlights newsHighlights = new NewsHighlights(newsRss);

        NewsHighlights enrichedNewsHighlights = parseToEnrich(newsRss.getBlob(),newsHighlights);

        newsHighlightsService.saveNewsHighlights(enrichedNewsHighlights);

    }

    private NewsHighlights parseToEnrich(String blob, NewsHighlights newsHighlights) {
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
                // note this can include regions, countries, states, etc
                XPathExpression geoExpr = xpath.compile("category[@domain='http://www.nytimes.com/namespaces/keywords/nyt_geo']");
                NodeList geoNodes = (NodeList) geoExpr.evaluate(item, XPathConstants.NODESET);
                for (int j = 0; j < geoNodes.getLength(); j++) {
                    Element geoEl = (Element) geoNodes.item(j);
                    log.info(" --> geo: {}", geoEl.getTextContent().trim());
                }
            }
        } catch (IOException e) {
            log.error("IO error parsing blob: {}", e.getMessage());
        } catch (SAXException e) {
            log.error("SAX error parsing blob: {}", e.getMessage());
        } catch (XPathExpressionException e) {
            log.error("XPath expression error: {}", e.getMessage());
        }

        log.info("Parsed document OK");

        return newsHighlights;
    }
}
