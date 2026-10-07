package br.com.studymate;
import br.com.studymate.service.VerificationMailService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import static org.mockito.Mockito.mock;
@TestConfiguration
public class SecurityTestMailConfig {
 @Bean @Primary VerificationMailService testVerificationMailService(){return mock(VerificationMailService.class);}
}
