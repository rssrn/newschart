package rossarn_at_gmail_dot_com.newschart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NewsChartApplication {

	public static void main(String[] args) {
		SpringApplication.run(NewsChartApplication.class, args);
	}

}
