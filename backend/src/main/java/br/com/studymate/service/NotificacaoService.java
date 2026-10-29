package br.com.studymate.service;

import br.com.studymate.config.NotificacaoPolicy;
import br.com.studymate.dto.*;
import br.com.studymate.exception.NotificacaoNaoEncontradaException;
import br.com.studymate.model.*;
import br.com.studymate.repository.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.*;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@Transactional(readOnly = true)
public class NotificacaoService {
    private static final Logger log = LoggerFactory.getLogger(NotificacaoService.class);
    private final NotificacaoRepository notificacoes;
    private final UsuarioRepository usuarios;
    private final DisciplinaRepository disciplinas;
    private final TarefaRepository tarefas;
    private final AvaliacaoRepository avaliacoes;
    private final FaltaRepository faltas;
    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final NotificacaoPolicy policy;
    private final TransactionTemplate transactions;
    private int ultimoUsuario;

    public NotificacaoService(NotificacaoRepository notificacoes, UsuarioRepository usuarios,
            DisciplinaRepository disciplinas, TarefaRepository tarefas, AvaliacaoRepository avaliacoes,
            FaltaRepository faltas, JdbcTemplate jdbc, Clock clock, NotificacaoPolicy policy,
            PlatformTransactionManager transactionManager) {
        this.notificacoes = notificacoes; this.usuarios = usuarios; this.disciplinas = disciplinas;
        this.tarefas = tarefas; this.avaliacoes = avaliacoes; this.faltas = faltas;
        this.jdbc = jdbc; this.clock = clock; this.policy = policy;
        this.transactions = new TransactionTemplate(transactionManager);
    }

    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public NotificacaoPageResponse listar(Integer idUsuario, Boolean lida, int page, int size) {
        if (page < 0 || page > 10000 || size < 1 || size > 50) {
            throw new IllegalArgumentException("Informe page entre 0 e 10000 e size entre 1 e 50.");
        }
        var result = notificacoes.listar(idUsuario, lida, PageRequest.of(page, size));
        return new NotificacaoPageResponse(result.getContent().stream().map(NotificacaoResponse::new).toList(),
                page, size, result.getTotalElements(), result.getTotalPages());
    }

    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public long totalNaoLidas(Integer idUsuario) {
        return notificacoes.countByIdUsuarioAndLidaFalseAndProcessadoEmIsNotNull(idUsuario);
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public NotificacaoResponse marcarLida(Long id, Integer idUsuario) {
        bloquearUsuario(idUsuario);
        Notificacao n = notificacoes.findByIdNotificacaoAndIdUsuarioAndProcessadoEmIsNotNull(id, idUsuario)
                .orElseThrow(NotificacaoNaoEncontradaException::new);
        if (!n.isLida()) n.setLida(true);
        return new NotificacaoResponse(n);
    }

    /** Called inside the academic write transaction; the user lock serializes schedulers and API/sync writers. */
    @Transactional
    public void sincronizarTarefa(Tarefa tarefa, Integer idUsuario) {
        bloquearUsuario(idUsuario);
        if (tarefa.getIdTarefa() == null) throw new IllegalArgumentException("Tarefa ainda não persistida.");
        Disciplina disciplina = disciplinaDoUsuario(tarefa.getIdDisciplina(), idUsuario);
        OffsetDateTime agora = agora();
        if (tarefa.getDeletedAt() != null || !"PENDENTE".equalsIgnoreCase(tarefa.getStatus())
                || tarefa.getDataEntrega() == null || !instante(tarefa.getDataEntrega()).isAfter(agora)) {
            cancelarOrigem(idUsuario, "TAREFA", tarefa.getIdTarefa().longValue());
            return;
        }
        OffsetDateTime prazo = instante(tarefa.getDataEntrega());
        OffsetDateTime previsto = prazo.minusHours(policy.taskLeadHours());
        registrar(idUsuario, disciplina.getIdDisciplina(), tarefa.getIdTarefa(), null, "TAREFA",
                tarefa.getIdTarefa().longValue(), "TAREFA_PRAZO", previsto, prazo.toInstant().toString(),
                "Tarefa próxima do prazo", "A tarefa \"" + tarefa.getTitulo() + "\" de " + disciplina.getNome()
                        + " tem entrega em " + tarefa.getDataEntrega() + " (" + policy.zone() + ").");
    }

    @Transactional
    public void cancelarTarefa(Integer idTarefa, Integer idUsuario) {
        bloquearUsuario(idUsuario);
        cancelarOrigem(idUsuario, "TAREFA", idTarefa.longValue());
    }

    @Transactional
    public void sincronizarAvaliacao(Avaliacao avaliacao, Integer idUsuario) {
        bloquearUsuario(idUsuario);
        if (avaliacao.getIdAvaliacao() == null) throw new IllegalArgumentException("Avaliação ainda não persistida.");
        Disciplina disciplina = disciplinaDoUsuario(avaliacao.getIdDisciplina(), idUsuario);
        LocalDate hoje = LocalDate.now(clock.withZone(policy.zone()));
        if (avaliacao.getNota() != null || avaliacao.getDataAvaliacao() == null || avaliacao.getDataAvaliacao().isBefore(hoje)) {
            cancelarOrigem(idUsuario, "AVALIACAO", avaliacao.getIdAvaliacao());
            return;
        }
        LocalDate data = avaliacao.getDataAvaliacao();
        if (data.isAfter(hoje)) registrar(idUsuario, disciplina.getIdDisciplina(), null, avaliacao.getIdAvaliacao(), "AVALIACAO",
                avaliacao.getIdAvaliacao(), "AVALIACAO_VESPERA", instante(data.minusDays(1).atTime(policy.eveHour(), 0)),
                data.toString(), "Avaliação próxima", "A avaliação \"" + avaliacao.getNome() + "\" de "
                        + disciplina.getNome() + " está prevista para " + data + ".");
        else cancelarTipo(idUsuario, "AVALIACAO", avaliacao.getIdAvaliacao(), "AVALIACAO_VESPERA");
        registrar(idUsuario, disciplina.getIdDisciplina(), null, avaliacao.getIdAvaliacao(), "AVALIACAO",
                avaliacao.getIdAvaliacao(), "AVALIACAO_DIA", instante(data.atTime(policy.dayHour(), 0)),
                data.toString(), "Avaliação do dia", "A avaliação \"" + avaliacao.getNome() + "\" de "
                        + disciplina.getNome() + " está prevista para " + data + ".");
    }

    @Transactional
    public void excluirAvaliacao(Long idAvaliacao, Integer idUsuario) {
        bloquearUsuario(idUsuario);
        for (Notificacao n : notificacoes.findByIdUsuarioAndIdAvaliacao(idUsuario, idAvaliacao)) {
            cancelarSePendente(n);
            n.setIdAvaliacao(null);
        }
        notificacoes.flush();
    }

    @Transactional
    public void excluirDisciplina(Integer idDisciplina, Integer idUsuario) {
        bloquearUsuario(idUsuario);
        for (Notificacao n : notificacoes.findByIdUsuarioAndIdDisciplina(idUsuario, idDisciplina)) {
            cancelarSePendente(n);
            n.setIdDisciplina(null);
        }
        notificacoes.flush();
    }

    @Transactional
    public void reavaliarDisciplina(Integer idDisciplina, Integer idUsuario) {
        bloquearUsuario(idUsuario);
        Disciplina d = disciplinaDoUsuario(idDisciplina, idUsuario);
        long total = faltas.somarFaltasPorDisciplina(idDisciplina);
        int limite = d.getLimiteFaltas();
        // A zero limit means no allowed absence, but zero absences never triggers an alert.
        boolean atingiu = total > 0 && total >= limite;
        boolean aproxima = limite > 0 && total >= Math.ceil(limite * policy.absenceRatio()) && !atingiu;
        if (atingiu) {
            cancelarTipo(idUsuario, "DISCIPLINA", idDisciplina.longValue(), "FALTAS_75");
            registrar(idUsuario, idDisciplina, null, null, "DISCIPLINA", idDisciplina.longValue(), "FALTAS_100",
                    agora(), Integer.toString(limite), "Limite de faltas atingido",
                    d.getNome() + ": " + total + " faltas registradas; limite da disciplina: " + limite + ".");
        } else {
            cancelarTipo(idUsuario, "DISCIPLINA", idDisciplina.longValue(), "FALTAS_100");
            if (aproxima) registrar(idUsuario, idDisciplina, null, null, "DISCIPLINA", idDisciplina.longValue(), "FALTAS_75",
                    agora(), Integer.toString(limite), "Atenção às faltas",
                    d.getNome() + ": " + total + " faltas registradas; limite da disciplina: " + limite + ".");
            else cancelarTipo(idUsuario, "DISCIPLINA", idDisciplina.longValue(), "FALTAS_75");
        }
        List<Avaliacao> lista = avaliacoes.findByIdDisciplinaOrderByDataAvaliacaoDescIdAvaliacaoDesc(idDisciplina);
        MediaDisciplinaResponse media = MediaPonderada.calcular(idDisciplina, lista);
        if (!policy.averageEnabled() || media.media() == null || media.media().compareTo(BigDecimal.valueOf(d.getMediaAprovacao())) >= 0) {
            cancelarTipo(idUsuario, "DISCIPLINA", idDisciplina.longValue(), "MEDIA_BAIXA");
            return;
        }
        String assinatura = BigDecimal.valueOf(d.getMediaAprovacao()).stripTrailingZeros().toPlainString() + ":" + lista.stream().filter(a -> a.getNota() != null)
                .sorted(Comparator.comparing(Avaliacao::getIdAvaliacao))
                .map(a -> a.getIdAvaliacao() + ":" + a.getNota().stripTrailingZeros().toPlainString() + ":" + a.getPeso().stripTrailingZeros().toPlainString()).toList();
        registrar(idUsuario, idDisciplina, null, null, "DISCIPLINA", idDisciplina.longValue(), "MEDIA_BAIXA", agora(),
                hash(assinatura), "Atenção à média acadêmica", d.getNome() + ": média das avaliações corrigidas "
                        + media.media() + ", média de aprovação " + d.getMediaAprovacao()
                        + ". Esta é uma média parcial e não determina reprovação definitiva.");
    }

    /** Bounded round-robin reconciliation also covers pre-existing records and missed scheduler runs. */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    public synchronized void processarPendentes() {
        List<Integer> ids = jdbc.queryForList("SELECT id_usuario FROM usuario WHERE id_usuario > ? ORDER BY id_usuario FETCH FIRST ? ROWS ONLY",
                Integer.class, ultimoUsuario, policy.userBatchSize());
        if (ids.isEmpty()) {
            ultimoUsuario = 0;
            ids = jdbc.queryForList("SELECT id_usuario FROM usuario ORDER BY id_usuario FETCH FIRST ? ROWS ONLY",
                    Integer.class, policy.userBatchSize());
        }
        List<Integer> devidos = jdbc.queryForList("""
                SELECT id_usuario FROM notificacao
                WHERE processado_em IS NULL AND cancelado_em IS NULL AND previsto_para <= ?
                GROUP BY id_usuario ORDER BY MIN(previsto_para), id_usuario FETCH FIRST ? ROWS ONLY
                """, Integer.class, agora(), policy.userBatchSize());
        Set<Integer> lote = new LinkedHashSet<>(devidos);
        lote.addAll(ids);
        for (Integer id : lote) {
            try { transactions.executeWithoutResult(status -> processarUsuarioInterno(id)); }
            catch (RuntimeException erro) { log.error("Falha ao processar notificações do usuário {}", id, erro); }
        }
        if (!ids.isEmpty()) ultimoUsuario = ids.get(ids.size() - 1);
    }

    @Transactional
    public void processarUsuario(Integer idUsuario) { processarUsuarioInterno(idUsuario); }

    private void processarUsuarioInterno(Integer idUsuario) {
        bloquearUsuario(idUsuario);
        // Explicit scalar columns avoid loading legacy task CLOBs while reconciling reminders.
        List<Tarefa> atuais = jdbc.query("""
                SELECT t.id_tarefa,t.id_disciplina,t.titulo,t.status,t.data_entrega FROM tarefa t
                JOIN disciplina d ON d.id_disciplina=t.id_disciplina
                JOIN periodo_letivo p ON p.id_periodo=d.id_periodo
                WHERE p.id_usuario=? AND t.deleted_at IS NULL AND t.status='PENDENTE'
                """, (rs, row) -> {
            Tarefa t = new Tarefa(); t.setIdTarefa(rs.getInt(1)); t.setIdDisciplina(rs.getInt(2));
            t.setTitulo(rs.getString(3)); t.setStatus(rs.getString(4));
            t.setDataEntrega(rs.getTimestamp(5).toLocalDateTime()); return t;
        }, idUsuario);
        for (Tarefa t : atuais) sincronizarTarefa(t, idUsuario);
        List<Integer> discIds = jdbc.queryForList("""
                SELECT d.id_disciplina FROM disciplina d JOIN periodo_letivo p ON p.id_periodo=d.id_periodo
                WHERE p.id_usuario=? ORDER BY d.id_disciplina
                """, Integer.class, idUsuario);
        for (Integer discId : discIds) {
            for (Avaliacao a : avaliacoes.findByIdDisciplinaOrderByDataAvaliacaoDescIdAvaliacaoDesc(discId)) {
                sincronizarAvaliacao(a, idUsuario);
            }
            reavaliarDisciplina(discId, idUsuario);
        }
        OffsetDateTime agora = agora();
        for (Notificacao n : notificacoes.pendentes(idUsuario, agora, PageRequest.of(0, policy.processingBatchSize()))) {
            if (origemAindaValida(n, idUsuario, agora)) processar(n, agora);
            else cancelarSePendente(n);
        }
        notificacoes.flush();
    }

    private boolean origemAindaValida(Notificacao n, Integer usuario, OffsetDateTime agora) {
        if ("TAREFA".equals(n.getOrigemTipo())) {
            return n.getIdTarefa() != null && tarefas.buscarPorIdEUsuario(n.getIdTarefa(), usuario)
                    .filter(t -> "PENDENTE".equalsIgnoreCase(t.getStatus()) && t.getDataEntrega() != null
                            && instante(t.getDataEntrega()).isAfter(agora)).isPresent();
        }
        if ("AVALIACAO".equals(n.getOrigemTipo())) {
            return n.getIdAvaliacao() != null && avaliacoes.buscarDoUsuario(n.getIdAvaliacao(), usuario)
                    .filter(a -> a.getNota() == null && a.getDataAvaliacao() != null
                            && ("AVALIACAO_VESPERA".equals(n.getTipo())
                                ? a.getDataAvaliacao().isAfter(agora.atZoneSameInstant(policy.zone()).toLocalDate())
                                : !a.getDataAvaliacao().isBefore(agora.atZoneSameInstant(policy.zone()).toLocalDate()))).isPresent();
        }
        return n.getIdDisciplina() != null && disciplinas.buscarPorIdEUsuario(n.getIdDisciplina(), usuario).isPresent();
    }

    private void registrar(Integer usuario, Integer disciplina, Integer tarefa, Long avaliacao, String origem,
            Long origemId, String tipo, OffsetDateTime previsto, String discriminador, String titulo, String mensagem) {
        String chave = usuario + ":" + origem + ":" + origemId + ":" + tipo + ":" + discriminador;
        for (Notificacao anterior : notificacoes.findByIdUsuarioAndOrigemTipoAndOrigemIdAndProcessadoEmIsNull(usuario, origem, origemId)) {
            if (tipo.equals(anterior.getTipo()) && !chave.equals(anterior.getChaveDeduplicacao())) cancelarSePendente(anterior);
        }
        Notificacao n = notificacoes.findByChaveDeduplicacao(chave).orElse(null);
        if (n != null && n.getProcessadoEm() != null) return;
        OffsetDateTime agora = agora();
        if (n == null) {
            n = new Notificacao(); n.setIdUsuario(usuario); n.setCriadoEm(agora);
            n.setOrigemTipo(origem); n.setOrigemId(origemId); n.setChaveDeduplicacao(chave); n.setLida(false);
            n.setDataEnvio(agora.atZoneSameInstant(policy.zone()).toLocalDateTime());
        }
        n.setIdDisciplina(disciplina); n.setIdTarefa(tarefa); n.setIdAvaliacao(avaliacao);
        n.setTitulo(titulo); n.setMensagem(mensagem); n.setTipo(tipo);
        n.setPrevistoPara(previsto.withOffsetSameInstant(ZoneOffset.UTC)); n.setCanceladoEm(null);
        if (!previsto.isAfter(agora)) processar(n, agora);
        notificacoes.saveAndFlush(n);
    }

    private void processar(Notificacao n, OffsetDateTime agora) {
        n.setProcessadoEm(agora); n.setDataEnvio(agora.atZoneSameInstant(policy.zone()).toLocalDateTime());
    }
    private void cancelarSePendente(Notificacao n) {
        if (n.getProcessadoEm() == null && n.getCanceladoEm() == null) n.setCanceladoEm(agora());
    }
    private void cancelarOrigem(Integer usuario, String origem, Long id) {
        notificacoes.findByIdUsuarioAndOrigemTipoAndOrigemIdAndProcessadoEmIsNull(usuario, origem, id).forEach(this::cancelarSePendente);
    }
    private void cancelarTipo(Integer usuario, String origem, Long id, String tipo) {
        notificacoes.findByIdUsuarioAndOrigemTipoAndOrigemIdAndProcessadoEmIsNull(usuario, origem, id).stream()
                .filter(n -> tipo.equals(n.getTipo())).forEach(this::cancelarSePendente);
    }
    private Disciplina disciplinaDoUsuario(Integer disciplina, Integer usuario) {
        return disciplinas.buscarPorIdEUsuario(disciplina, usuario)
                .orElseThrow(() -> new IllegalArgumentException("Disciplina não encontrada."));
    }
    private void bloquearUsuario(Integer usuario) {
        if (usuario == null || usuario <= 0) throw new IllegalArgumentException("Usuário inválido.");
        usuarios.buscarParaAtualizacao(usuario).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
    }
    private OffsetDateTime agora() { return OffsetDateTime.ofInstant(clock.instant(), ZoneOffset.UTC); }
    private OffsetDateTime instante(LocalDateTime local) { return local.withNano(0).atZone(policy.zone()).toOffsetDateTime().withOffsetSameInstant(ZoneOffset.UTC); }
    private static String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException erro) { throw new IllegalStateException(erro); }
    }
}
