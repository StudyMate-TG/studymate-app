package br.com.studymate;
import br.com.studymate.config.RequestBodyLimitFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.junit.jupiter.api.Assertions.*;
class RequestBodyLimitTests {
 @Test void rejectsKnownOversizedBodyBeforeController()throws Exception{
  var req=new MockHttpServletRequest("POST","/api/tarefas");req.setContent(new byte[4097]);
  var res=new MockHttpServletResponse();AtomicBoolean invoked=new AtomicBoolean();
  new RequestBodyLimitFilter(4096).doFilter(req,res,(r,s)->invoked.set(true));
  assertEquals(413,res.getStatus());assertFalse(invoked.get());
 }
 @Test void rejectsOversizedChunkedBodyEvenWithoutDeclaredLength()throws Exception{
  var req=new MockHttpServletRequest("PUT","/api/tarefas/1"){
   @Override public int getContentLength(){return -1;}
   @Override public long getContentLengthLong(){return -1;}
  };req.setContent(new byte[4097]);req.addHeader("Transfer-Encoding","chunked");
  var res=new MockHttpServletResponse();AtomicBoolean invoked=new AtomicBoolean();
  new RequestBodyLimitFilter(4096).doFilter(req,res,(r,s)->invoked.set(true));
  assertEquals(413,res.getStatus());assertFalse(invoked.get());
 }
 @Test void boundedBodyRemainsAvailableToMvcReader()throws Exception{
  byte[] content="{\"nome\":\"ação\"}".getBytes(StandardCharsets.UTF_8);
  var req=new MockHttpServletRequest("POST","/api/auth/register");req.setContent(content);req.setCharacterEncoding("UTF-8");
  var res=new MockHttpServletResponse();AtomicBoolean invoked=new AtomicBoolean();
  new RequestBodyLimitFilter(4096).doFilter(req,res,(r,s)->{
   var wrapped=(HttpServletRequest)r;assertArrayEquals(content,wrapped.getInputStream().readAllBytes());
   assertEquals("{\"nome\":\"ação\"}",wrapped.getReader().readLine());assertEquals(content.length,wrapped.getContentLength());invoked.set(true);
  });assertTrue(invoked.get());
 }
}
