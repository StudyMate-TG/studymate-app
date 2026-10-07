package br.com.studymate.config;
import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.mail.javamail.*;
import java.time.Clock;
import java.util.Properties;
@Configuration
@EnableScheduling
public class SecurityInfrastructureConfig {
 @Bean Clock securityClock(){ return Clock.systemUTC(); }
 @Bean ThreadPoolTaskExecutor verificationExecutor(){
  var executor=new ThreadPoolTaskExecutor();
  executor.setCorePoolSize(2);executor.setMaxPoolSize(2);executor.setQueueCapacity(100);
  executor.setThreadNamePrefix("email-verification-");executor.setWaitForTasksToCompleteOnShutdown(false);
  executor.initialize();return executor;
 }
 @Bean JavaMailSender mailSender(@Value("${app.smtp.host:}") String host,
  @Value("${app.smtp.port:587}") int port,@Value("${app.smtp.username:}") String username,
  @Value("${app.smtp.password:}") String password,@Value("${app.smtp.starttls:true}") boolean tls){
  var sender=new JavaMailSenderImpl();sender.setHost(host);sender.setPort(port);
  sender.setUsername(username);sender.setPassword(password);sender.setDefaultEncoding("UTF-8");
  Properties p=sender.getJavaMailProperties();
  p.put("mail.smtp.auth",Boolean.toString(!username.isBlank()));
  p.put("mail.smtp.starttls.enable",Boolean.toString(tls));
  p.put("mail.smtp.starttls.required",Boolean.toString(tls));
  p.put("mail.smtp.ssl.checkserveridentity","true");
  p.put("mail.smtp.connectiontimeout","5000");p.put("mail.smtp.timeout","5000");p.put("mail.smtp.writetimeout","5000");
  return sender;
 }
}
