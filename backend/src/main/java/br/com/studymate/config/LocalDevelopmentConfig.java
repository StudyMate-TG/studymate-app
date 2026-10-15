package br.com.studymate.config;

import br.com.studymate.dto.RegisterRequest;
import br.com.studymate.repository.UsuarioRepository;
import br.com.studymate.service.UsuarioCadastroService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import java.nio.file.Files;
import java.nio.file.Path;
import java.io.IOException;
import java.util.UUID;

/** Fixtures and a file mailbox used only by the explicitly enabled local profile. */
@Configuration
@Profile("local")
public class LocalDevelopmentConfig {
    @Bean
    ApplicationRunner localTestAccount(UsuarioRepository users, UsuarioCadastroService cadastro) {
        return args -> {
            if (!users.existsByEmailIgnoreCase("teste@studymate.local")) {
                var request = new RegisterRequest();
                request.setNome("Estudante de teste");
                request.setEmail("teste@studymate.local");
                request.setSenha("StudyMate123!");
                cadastro.criar(request);
            }
        };
    }

    @Bean
    @Primary
    JavaMailSender localMailbox() {
        return new JavaMailSenderImpl() {
            @Override
            public void send(SimpleMailMessage message) {
                try {
                    Path directory = Path.of(".local", "emails");
                    Files.createDirectories(directory);
                    Files.writeString(directory.resolve(UUID.randomUUID() + ".txt"),
                        "Para: " + String.join(", ", message.getTo()) + "\n"
                        + "Assunto: " + message.getSubject() + "\n\n" + message.getText());
                } catch (IOException error) {
                    throw new MailSendException("Falha ao salvar e-mail local", error);
                }
            }
        };
    }
}
