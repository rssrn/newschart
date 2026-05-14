package uk.rossarnold.newschart;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import uk.rossarnold.newschart.scheduler.BasicFetchSchedulerService;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class NewschartApplicationTests {

	@MockitoBean
	@SuppressWarnings("unused")
	private BasicFetchSchedulerService basicFetchSchedulerService;

	@Test
	void contextLoads() {
	}

}
