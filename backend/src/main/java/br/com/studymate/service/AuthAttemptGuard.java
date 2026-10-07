package br.com.studymate.service;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.*;
import br.com.studymate.exception.TooManyAuthAttemptsException;
@Component
public class AuthAttemptGuard {
 private final AuthRateLimitService limiter;
 public AuthAttemptGuard(AuthRateLimitService limiter){this.limiter=limiter;}
 public void requireAllowed(AuthRateLimitService.Operation operation,String account){
  var attributes=RequestContextHolder.getRequestAttributes();
  String origin=attributes instanceof ServletRequestAttributes servlet
    ? servlet.getRequest().getRemoteAddr() : "internal";
  var decision=limiter.acquire(operation,origin,account);
  // acquire's independent transaction has already committed, including failed-attempt counters.
  if(!decision.allowed())throw new TooManyAuthAttemptsException(decision.retryAfterSeconds());
 }
}
