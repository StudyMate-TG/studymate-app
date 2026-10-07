package br.com.studymate.config;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.*;
@Component @Order(Ordered.HIGHEST_PRECEDENCE+10)
public class RequestBodyLimitFilter extends OncePerRequestFilter {
 private final int max;
 public RequestBodyLimitFilter(@Value("${app.http.max-body-bytes:65536}")int max){
  if(max<4096||max>1048576)throw new IllegalArgumentException("Limite de corpo inválido.");
  this.max=max;
 }
 @Override protected boolean shouldNotFilter(HttpServletRequest req){
  return !java.util.Set.of("POST","PUT","PATCH").contains(req.getMethod());
 }
 @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)
  throws IOException,ServletException{
  if(req.getContentLengthLong()>max){recusar(res);return;}
  byte[] body=req.getInputStream().readNBytes(max+1);
  if(body.length>max){recusar(res);return;}
  chain.doFilter(new BufferedRequest(req,body),res);
 }
 private void recusar(HttpServletResponse response)throws IOException{
  response.setStatus(413);response.setContentType("application/json;charset=UTF-8");
  response.getWriter().write("{\"mensagem\":\"Corpo da requisição excede o limite permitido.\"}");
 }
 private static final class BufferedRequest extends HttpServletRequestWrapper {
  private final byte[] body;
  BufferedRequest(HttpServletRequest req,byte[] body){super(req);this.body=body;}
  @Override public int getContentLength(){return body.length;}
  @Override public long getContentLengthLong(){return body.length;}
  @Override public BufferedReader getReader()throws IOException{
   String encoding=getCharacterEncoding();return new BufferedReader(new InputStreamReader(getInputStream(),encoding==null?"UTF-8":encoding));
  }
  @Override public ServletInputStream getInputStream(){
   return new ServletInputStream(){
    private final ByteArrayInputStream input=new ByteArrayInputStream(body);
    private ReadListener listener;private boolean notified;
    @Override public int read()throws IOException{int value=input.read();finish();return value;}
    @Override public int read(byte[] bytes,int offset,int length)throws IOException{
     int value=input.read(bytes,offset,length);finish();return value;
    }
    private void finish()throws IOException{if(listener!=null&&!notified&&isFinished()){notified=true;listener.onAllDataRead();}}
    @Override public boolean isFinished(){return input.available()==0;}
    @Override public boolean isReady(){return true;}
    @Override public void setReadListener(ReadListener value){
     if(value==null||listener!=null)throw new IllegalStateException("ReadListener inválido.");
     listener=value;
     try{if(isFinished())finish();else listener.onDataAvailable();}catch(IOException error){listener.onError(error);}
    }
   };
  }
 }
}
