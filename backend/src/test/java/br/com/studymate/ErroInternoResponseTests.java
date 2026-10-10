package br.com.studymate;

import br.com.studymate.controller.*;
import br.com.studymate.service.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.sql.SQLException;
import java.util.stream.Stream;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ErroInternoResponseTests {
    @BeforeEach void autenticar() {
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new JwtAuthenticationToken(
                Jwt.withTokenValue("test").header("alg", "HS256").subject("1").build()));
        SecurityContextHolder.setContext(context);
    }
    @AfterEach void limpar() { SecurityContextHolder.clearContext(); }

    static Stream<Arguments> rotas() {
        return Stream.of(
                Arguments.of("disciplinas", "GET", ""), Arguments.of("disciplinas", "GET", "/1"),
                Arguments.of("disciplinas", "POST", ""), Arguments.of("disciplinas", "PUT", "/1"),
                Arguments.of("disciplinas", "DELETE", "/1"),
                Arguments.of("periodos", "GET", ""), Arguments.of("periodos", "GET", "/ativo"),
                Arguments.of("periodos", "GET", "/1"), Arguments.of("periodos", "POST", ""),
                Arguments.of("periodos", "PUT", "/1"), Arguments.of("periodos", "PUT", "/1/ativar"),
                Arguments.of("periodos", "DELETE", "/1"),
                Arguments.of("faltas", "GET", ""), Arguments.of("faltas", "GET", "/total"),
                Arguments.of("faltas", "POST", ""), Arguments.of("faltas", "PUT", "/1"),
                Arguments.of("faltas", "DELETE", "/1"),
                Arguments.of("tarefas", "GET", ""), Arguments.of("tarefas", "GET", "/1"),
                Arguments.of("tarefas", "POST", ""), Arguments.of("tarefas", "PUT", "/1"),
                Arguments.of("tarefas", "PATCH", "/1/concluir"), Arguments.of("tarefas", "DELETE", "/1")
        );
    }

    @ParameterizedTest @MethodSource("rotas")
    void falhasInternasNaoExpoemSqlNemCausas(String modulo, String metodo, String sufixo) throws Exception {
        for (RuntimeException erro : new RuntimeException[]{
                new DataIntegrityViolationException("INSERT INTO tabela_interna constraint segredo",
                        new SQLException("ORA-02291 esquema_interno senha_exemplo")),
                new IllegalStateException("jdbc:oracle detalhes_internos",
                        new RuntimeException("causa_interna_confidencial"))}) {
            mvc(modulo, erro).perform(request(HttpMethod.valueOf(metodo), "/api/" + modulo + sufixo)
                            .param("idDisciplina", "1").contentType("application/json").content("{}"))
                    .andExpect(status().isInternalServerError())
                    .andExpect(content().json("{\"mensagem\":\"Erro interno ao processar a solicitação.\"}", true));
        }
    }

    @ParameterizedTest @ValueSource(strings = {"disciplinas", "periodos", "faltas", "tarefas"})
    void mantemValidacaoDeNegocio400(String modulo) throws Exception {
        mvc(modulo, new IllegalArgumentException("Disciplina não encontrada."))
                .perform(get("/api/" + modulo).param("idDisciplina", "1"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.mensagem").value("Disciplina não encontrada."));
    }

    @ParameterizedTest @ValueSource(strings = {"disciplinas", "periodos", "faltas", "tarefas"})
    void acessoNegadoContinuaPropagandoAoFiltro(String modulo) {
        // Standalone MVC has no security filter: the exception must escape for the real filter to return 403.
        var erro = org.junit.jupiter.api.Assertions.assertThrows(jakarta.servlet.ServletException.class,
                () -> mvc(modulo, new AccessDeniedException("negado")).perform(
                        get("/api/" + modulo).param("idDisciplina", "1")));
        org.junit.jupiter.api.Assertions.assertInstanceOf(AccessDeniedException.class, erro.getCause());
    }

    @ParameterizedTest @ValueSource(strings = {"disciplinas", "periodos", "faltas", "tarefas"})
    void listagemValidaPermanece200(String modulo) throws Exception {
        mvc(modulo, null).perform(get("/api/" + modulo).param("idDisciplina", "1"))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
    }

    @ParameterizedTest @ValueSource(strings = {"disciplinas", "periodos", "faltas", "tarefas"})
    void jsonMalformadoPermanece400(String modulo) throws Exception {
        mvc(modulo, null).perform(post("/api/" + modulo).contentType("application/json").content("{"))
                .andExpect(status().isBadRequest());
    }

    private MockMvc mvc(String modulo, RuntimeException erro) {
        Object controller = switch (modulo) {
            case "disciplinas" -> new DisciplinaController(service(DisciplinaService.class, erro));
            case "periodos" -> new PeriodoLetivoController(service(PeriodoLetivoService.class, erro));
            case "faltas" -> new FaltaController(service(FaltaService.class, erro));
            case "tarefas" -> new TarefaController(service(TarefaService.class, erro));
            default -> throw new IllegalArgumentException(modulo);
        };
        return MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();
    }
    private <T> T service(Class<T> tipo, RuntimeException erro) {
        return erro == null ? mock(tipo) : mock(tipo, invocation -> { throw erro; });
    }
}
