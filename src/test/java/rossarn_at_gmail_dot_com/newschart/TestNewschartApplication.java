package rossarn_at_gmail_dot_com.newschart;

import org.springframework.boot.SpringApplication;

public class TestNewschartApplication {

	public static void main(String[] args) {
		SpringApplication.from(NewschartApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
