package br.com.studymate;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@org.springframework.context.annotation.Import(SecurityTestMailConfig.class)
@ActiveProfiles("test")
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
