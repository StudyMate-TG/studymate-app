package br.com.studymate.service;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.slf4j.*;
import br.com.studymate.exception.EmailVerificationUnavailableException;
@Service
public class VerificationMailService {
 private static final Logger log=LoggerFactory.getLogger(VerificationMailService.class);
 private final JavaMailSender sender;private final ThreadPoolTaskExecutor executor;
 private final String host,from;
 public VerificationMailService(JavaMailSender sender,ThreadPoolTaskExecutor executor,
   @Value("${app.smtp.host:}")String host,@Value("${app.smtp.from:}")String from){
  this.sender=sender;this.executor=executor;this.host=host;this.from=from;
 }
 public void requireConfigured(){
  if(host.isBlank()||from.isBlank())throw new EmailVerificationUnavailableException();
 }
 public void enqueue(String email,String codigo){
  try{
   executor.execute(()->{
    try{
     var message=new SimpleMailMessage();message.setFrom(from);message.setTo(email);
     message.setSubject("StudyMate: confirme seu e-mail");
     message.setText("Se você solicitou cadastro ou alteração de e-mail no StudyMate, use o código abaixo junto com sua senha na tela de confirmação.\n\n"+
       codigo+"\n\nNão compartilhe o código. Se não solicitou esta ação, ignore a mensagem. O código expira em poucos minutos.");
     sender.send(message);
    }catch(Exception erro){
     // SMTP errors can contain recipients or credentials: never include their text or the code in logs.
     log.warn("Falha no envio de confirmação de e-mail; solicite um novo código.");
    }
   });
  }catch(RuntimeException erro){log.warn("Fila de confirmação de e-mail ocupada; solicite um novo código.");}
 }
}
