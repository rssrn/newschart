package rossarn_at_gmail_dot_com.newschart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.resilience.annotation.EnableResilientMethods;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableCaching
@EnableResilientMethods
public class NewsChartApplication {

	public static void main(String[] args) {
		SpringApplication.run(NewsChartApplication.class, args);
	}

}
