package rossarn_at_gmail_dot_com.newschart.geo;

import com.opencsv.bean.CsvToBeanBuilder;
import jakarta.annotation.PostConstruct;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class CountryFactory {

    private static final Logger log = LogManager.getLogger(CountryFactory.class);
    Map<String, Country> countryMap = new HashMap<>();

    private final ResourceLoader resourceLoader;

    public CountryFactory(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void init() throws IOException {
        // load all countries from static csv
        Resource resource = resourceLoader.getResource("classpath:static/countries.csv");
        BufferedReader csvReader = new BufferedReader(new InputStreamReader(resource.getInputStream()));
        List<Country> countryList = new CsvToBeanBuilder<Country>(csvReader).withType(Country.class).build().parse();
        log.info("Loaded {} countries", countryList.size());
        for (Country country: countryList) {
            countryMap.put(country.getName(), country);
        }
    }

    public boolean isValidCountry(String name) {
        return countryMap.containsKey(name);
    }

    public Country getCountry(String name) {
        if (countryMap.containsKey(name)) {
            return countryMap.get(name);
        } else {
            log.error("Unknown country name: {}", name);
            return null;
        }
    }
}
