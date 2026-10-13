package br.com.studymate.service;

import br.com.studymate.dto.GamificacaoResponse;
import br.com.studymate.dto.GamificacaoResponse.Dia;
import br.com.studymate.dto.GamificacaoResponse.Medalha;
import br.com.studymate.model.Tarefa;
import br.com.studymate.repository.GamificacaoRepository;
import br.com.studymate.repository.UsuarioRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class GamificacaoService {
    public static final int XP_TAREFA = 30;
    public static final int XP_PRESENCA = 20;
    public static final int META_DIARIA = 30;
    private static final ZoneId ZONA = ZoneId.of("America/Sao_Paulo");
    private final GamificacaoRepository repository;
    private final UsuarioRepository usuarios;
    private final Clock clock;

    public GamificacaoService(GamificacaoRepository repository, UsuarioRepository usuarios, Clock clock) {
        this.repository = repository;
        this.usuarios = usuarios;
        this.clock = clock;
    }

    private record Objetivo(String codigo, String nome, String descricao, String icone, String categoria, int meta) {}
    private static final List<Objetivo> OBJETIVOS = List.of(
            new Objetivo("PRIMEIRA_TAREFA", "Primeiro passo", "Conclua sua primeira tarefa.", "checkmark-circle", "TAREFAS", 1),
            new Objetivo("TAREFAS_5", "Em movimento", "Conclua 5 tarefas diferentes.", "rocket", "TAREFAS", 5),
            new Objetivo("TAREFAS_20", "Missão cumprida", "Conclua 20 tarefas diferentes.", "trophy", "TAREFAS", 20),
            new Objetivo("PRIMEIRA_PRESENCA", "Presente!", "Registre sua primeira presença em aula.", "school", "PRESENCAS", 1),
            new Objetivo("PRESENCAS_10", "Na primeira fila", "Registre presença em 10 aulas.", "ribbon", "PRESENCAS", 10),
            new Objetivo("OFENSIVA_3", "Pegando fogo", "Mantenha 3 dias consecutivos de atividade.", "flame", "OFENSIVA", 3),
            new Objetivo("OFENSIVA_7", "Semana de ouro", "Mantenha 7 dias consecutivos de atividade.", "flame", "OFENSIVA", 7),
            new Objetivo("OFENSIVA_30", "Constância de mestre", "Mantenha 30 dias consecutivos de atividade.", "diamond", "OFENSIVA", 30),
            new Objetivo("XP_100", "Aprendiz", "Acumule 100 XP.", "flash", "XP", 100),
            new Objetivo("XP_500", "Explorador", "Acumule 500 XP.", "star", "XP", 500));

    public LocalDate hoje() { return LocalDate.now(clock.withZone(ZONA)); }
    public LocalDateTime agoraLocal() { return LocalDateTime.now(clock.withZone(ZONA)); }
    private OffsetDateTime agora() { return OffsetDateTime.now(clock.withZone(ZONA)); }

    @Transactional(readOnly = false)
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public GamificacaoResponse consultar(Integer idUsuario) {
        if (idUsuario == null || idUsuario <= 0) {
            throw new IllegalArgumentException("Usuário não encontrado.");
        }
        // Keep every projection in the same snapshot as the serialized reward writes.
        bloquear(idUsuario);
        LocalDate hoje = hoje();
        var progresso = repository.progresso(idUsuario);
        var dias = repository.dias(idUsuario);
        var contagem = repository.contagem(idUsuario);
        var sequencia = sequencia(dias, hoje);
        int melhor = Math.max(progresso.melhorOfensiva(), sequencia.melhor());
        var desbloqueadas = repository.medalhas(idUsuario);
        List<Medalha> medalhas = new ArrayList<>();
        for (Objetivo objetivo : OBJETIVOS) {
            int valor = valor(objetivo, progresso.xpTotal(), contagem, melhor);
            medalhas.add(new Medalha(objetivo.codigo(), objetivo.nome(), objetivo.descricao(),
                    objetivo.icone(), objetivo.categoria(), objetivo.meta(), Math.min(valor, objetivo.meta()),
                    desbloqueadas.containsKey(objetivo.codigo()), desbloqueadas.get(objetivo.codigo())));
        }
        List<Dia> semana = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate dia = hoje.minusDays(i);
            semana.add(new Dia(dia, dias.containsKey(dia), dias.getOrDefault(dia, 0)));
        }
        int xp = progresso.xpTotal();
        return new GamificacaoResponse(xp, xp / 100 + 1, xp % 100, 100 - xp % 100,
                sequencia.atual(), melhor, dias.containsKey(hoje), dias.getOrDefault(hoje, 0),
                META_DIARIA, contagem.tarefas(), contagem.presencas(), dias.size(),
                semana, medalhas, repository.recentes(idUsuario));
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public void premiarConclusao(Integer idUsuario, Tarefa tarefa) {
        // The existing user lock serializes this with direct completion and offline sync.
        bloquear(idUsuario);
        if ((tarefa.getXpGerado() != null && tarefa.getXpGerado() > 0)
                || repository.possuiPremioTarefa(idUsuario, tarefa.getIdTarefa())) {
            return;
        }
        registrar(idUsuario, "TAREFA", tarefa.getIdTarefa(), "Tarefa concluída: " + tarefa.getTitulo(), XP_TAREFA, agora());
        tarefa.setXpGerado(XP_TAREFA);
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public void premiarPresenca(Integer idUsuario, Integer idPresenca, String disciplina, LocalDate dia) {
        bloquear(idUsuario);
        OffsetDateTime instante = agora();
        if (dia == null || !dia.equals(instante.toLocalDate())) {
            throw new IllegalArgumentException("A presença só pode ser registrada para hoje, no horário de São Paulo.");
        }
        registrar(idUsuario, "PRESENCA", idPresenca, "Presença em " + disciplina, XP_PRESENCA, instante);
    }

    private void bloquear(Integer usuario) {
        usuarios.buscarParaAtualizacao(usuario).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
    }

    private void registrar(Integer usuario, String tipo, Integer origem, String descricao, int xp, OffsetDateTime instante) {
        LocalDate dia = instante.toLocalDate();
        var anterior = repository.progresso(usuario);
        repository.registrar(usuario, tipo, origem, descricao, xp, dia, instante);
        int total = Math.addExact(anterior.xpTotal(), xp);
        var dias = repository.dias(usuario);
        var sequencia = sequencia(dias, dia);
        int melhor = Math.max(anterior.melhorOfensiva(), sequencia.melhor());
        repository.atualizar(usuario, total, sequencia.atual(), melhor, sequencia.ultimo());
        var contagem = repository.contagem(usuario);
        var desbloqueadas = repository.medalhas(usuario);
        for (Objetivo objetivo : OBJETIVOS) {
            if (!desbloqueadas.containsKey(objetivo.codigo()) && valor(objetivo, total, contagem, melhor) >= objetivo.meta()) {
                repository.desbloquear(usuario, objetivo.codigo(), instante);
            }
        }
    }

    private int valor(Objetivo objetivo, int xp, GamificacaoRepository.Contagem contagem, int melhor) {
        return switch (objetivo.categoria()) {
            case "TAREFAS" -> contagem.tarefas();
            case "PRESENCAS" -> contagem.presencas();
            case "OFENSIVA" -> melhor;
            default -> xp;
        };
    }

    private record Sequencia(int atual, int melhor, LocalDate ultimo) {}
    private Sequencia sequencia(Map<LocalDate, Integer> dias, LocalDate hoje) {
        LocalDate ultimo = null;
        int consecutivos = 0;
        int melhor = 0;
        for (LocalDate dia : dias.keySet()) {
            if (dia.isAfter(hoje)) continue;
            consecutivos = ultimo != null && ultimo.plusDays(1).equals(dia) ? consecutivos + 1 : 1;
            melhor = Math.max(melhor, consecutivos);
            ultimo = dia;
        }
        // Yesterday remains an active streak until the student misses the whole current day.
        int atual = ultimo != null && !ultimo.isBefore(hoje.minusDays(1)) ? consecutivos : 0;
        return new Sequencia(atual, melhor, ultimo);
    }
}
