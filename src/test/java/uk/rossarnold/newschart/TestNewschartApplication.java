package uk.rossarnold.newschart;

import org.springframework.boot.SpringApplication;

public class TestNewschartApplication {

	public static void main(String[] args) {
		SpringApplication.from(NewsChartApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
