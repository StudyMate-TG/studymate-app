package br.com.studymate;
import java.util.function.Supplier;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
final class TestIdentity {
 static <T> T callAs(Integer usuario, Supplier<T> action) {
  var before=SecurityContextHolder.getContext(); var context=SecurityContextHolder.createEmptyContext();
  context.setAuthentication(new JwtAuthenticationToken(Jwt.withTokenValue("test").header("alg","HS256").subject(usuario.toString()).build()));
  SecurityContextHolder.setContext(context);
  try {return action.get();} finally {SecurityContextHolder.setContext(before);}
 }
 static void runAs(Integer usuario,Runnable action){callAs(usuario,()->{action.run();return null;});}
}
