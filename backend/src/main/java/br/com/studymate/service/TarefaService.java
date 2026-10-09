package br.com.studymate.service;

import br.com.studymate.dto.TarefaRequest;
import br.com.studymate.dto.TarefaResponse;
import br.com.studymate.dto.TarefaResumoResponse;
import br.com.studymate.model.Disciplina;
import br.com.studymate.model.Tarefa;
import br.com.studymate.repository.DisciplinaRepository;
import br.com.studymate.repository.TarefaRepository;
import br.com.studymate.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class TarefaService {

    private final TarefaRepository tarefaRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final UsuarioRepository usuarioRepository;
    private final int maxCount;
    private final int maxDescription;
    private final long maxStoredChars;

    public TarefaService(
            TarefaRepository tarefaRepository,
            DisciplinaRepository disciplinaRepository,
            UsuarioRepository usuarioRepository,
            @Value("${app.tasks.max-count:1000}") int maxCount,
            @Value("${app.tasks.max-description:4096}") int maxDescription,
            @Value("${app.tasks.max-stored-chars:4096000}") long maxStoredChars) {

        this.tarefaRepository = tarefaRepository;
        this.disciplinaRepository = disciplinaRepository;
        this.usuarioRepository = usuarioRepository;
        if (maxCount < 1 || maxCount > 1000
                || maxDescription < 1 || maxDescription > 4096
                || maxStoredChars < 1 || maxStoredChars > 4096000L) {
            throw new IllegalArgumentException("Os limites de tarefas excedem os limites permitidos.");
        }
        this.maxCount = maxCount;
        this.maxDescription = maxDescription;
        this.maxStoredChars = maxStoredChars;
    }

    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public List<TarefaResumoResponse> listar(Integer idUsuario) {
        return listar(idUsuario, 0, 50);
    }

    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public List<TarefaResumoResponse> listar(Integer idUsuario, Integer page, Integer size) {
        validarIdUsuario(idUsuario);
        if (page == null || page < 0 || page > 10000
                || size == null || size < 1 || size > 50) {
            throw new IllegalArgumentException("Informe page entre 0 e 10000 e size entre 1 e 50.");
        }
        return tarefaRepository.listarPorUsuario(idUsuario, PageRequest.of(page, size));
    }

    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public TarefaResponse consultarPorId(
            Integer idTarefa,
            Integer idUsuario) {

        Tarefa tarefa = buscarDoUsuario(idTarefa, idUsuario);

        return resposta(tarefa, idUsuario);
    }

    @Transactional
    @PreAuthorize("#request != null and #request.idUsuario != null and #request.idUsuario.toString() == authentication.name")
    public TarefaResponse cadastrar(TarefaRequest request) {

        validarDadosTarefa(request);

        bloquearUsuario(request.getIdUsuario());
        validarCotaCadastro(request.getIdUsuario(), tamanhoDescricaoNormalizada(request));

        Disciplina disciplina =
                disciplinaRepository.buscarPorIdEUsuario(
                        request.getIdDisciplina(),
                        request.getIdUsuario()
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "A disciplina informada não pertence ao usuário."
                        )
                );

        Tarefa tarefa = new Tarefa();

        tarefa.setIdDisciplina(disciplina.getIdDisciplina());

        preencherDados(tarefa, request);

        // Valores controlados pelo backend.
        tarefa.setStatus("PENDENTE");
        tarefa.setDataConclusao(null);

        // Ainda não definimos a regra de XP.
        tarefa.setXpGerado(0);

        Tarefa salva =
                tarefaRepository.saveAndFlush(tarefa);

        return new TarefaResponse(
                salva,
                disciplina.getNome()
        );
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public TarefaResponse alterar(
            Integer idTarefa,
            Integer idUsuario,
            TarefaRequest request) {

        validarDadosTarefa(request);
        validarIdUsuario(idUsuario);

        if (request.getIdUsuario() != null
                && !idUsuario.equals(request.getIdUsuario())) {

            throw new IllegalArgumentException(
                    "Usuário da URL e do corpo da requisição são diferentes."
            );
        }

        bloquearUsuario(idUsuario);

        long tamanhoAnterior = tamanhoDescricaoDoUsuario(idTarefa, idUsuario);

        Disciplina disciplina =
                disciplinaRepository.buscarPorIdEUsuario(
                        request.getIdDisciplina(),
                        idUsuario
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "A disciplina informada não pertence ao usuário."
                        )
                );

        validarCotaAlteracao(idUsuario, tamanhoAnterior, tamanhoDescricaoNormalizada(request));
        int alteradas = tarefaRepository.atualizarPorIdEUsuario(
                idTarefa, idUsuario, disciplina.getIdDisciplina(),
                request.getTitulo().trim(), request.getTipo().trim(), descricaoNormalizada(request),
                request.getDataHoraInicio(), request.getDataEntrega(), request.getPrioridade().trim(),
                OffsetDateTime.now());
        if (alteradas != 1) {
            throw new IllegalArgumentException("Tarefa não encontrada.");
        }
        return new TarefaResponse(buscarDoUsuario(idTarefa, idUsuario), disciplina.getNome());
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public TarefaResponse concluir(
            Integer idTarefa,
            Integer idUsuario) {

        bloquearUsuario(idUsuario);

        Tarefa tarefa =
                buscarDoUsuario(idTarefa, idUsuario);

        if ("CONCLUIDA".equalsIgnoreCase(
                tarefa.getStatus())) {

            throw new IllegalArgumentException(
                    "A tarefa já está concluída."
            );
        }

        tarefa.setStatus("CONCLUIDA");
        tarefa.setDataConclusao(
                LocalDateTime.now()
        );

        Tarefa salva =
                tarefaRepository.saveAndFlush(tarefa);

        return resposta(salva, idUsuario);
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public void excluir(
            Integer idTarefa,
            Integer idUsuario) {

        bloquearUsuario(idUsuario);

        validarIdTarefa(idTarefa);
        if (tarefaRepository.excluirPorIdEUsuario(idTarefa, idUsuario, OffsetDateTime.now()) != 1) {
            throw new IllegalArgumentException("Tarefa não encontrada.");
        }
    }

    private Tarefa buscarDoUsuario(
            Integer idTarefa,
            Integer idUsuario) {

        long tamanho = tamanhoDescricaoDoUsuario(idTarefa, idUsuario);
        if (tamanho > maxDescription) {
            throw new IllegalArgumentException(
                    "A descrição desta tarefa excede o limite. Edite a tarefa antes de consultar ou concluir.");
        }

        return tarefaRepository
                .buscarPorIdEUsuario(
                        idTarefa,
                        idUsuario
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Tarefa não encontrada."
                        )
                );
    }

    private long tamanhoDescricaoDoUsuario(Integer idTarefa, Integer idUsuario) {
        validarIdUsuario(idUsuario);
        validarIdTarefa(idTarefa);
        return tarefaRepository.tamanhoDescricaoPorIdEUsuario(idTarefa, idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Tarefa não encontrada."));
    }

    private void validarIdTarefa(Integer idTarefa) {
        if (idTarefa == null || idTarefa <= 0) {
            throw new IllegalArgumentException("A tarefa informada é inválida.");
        }
    }

    private void validarCotaCadastro(Integer idUsuario, int tamanhoNovo) {
        if (tarefaRepository.contarPorUsuario(idUsuario) >= maxCount) {
            throw new IllegalArgumentException("O limite de tarefas por usuário foi atingido.");
        }
        if (tarefaRepository.totalCaracteresPorUsuario(idUsuario) > maxStoredChars - tamanhoNovo) {
            throw new IllegalArgumentException("O limite de caracteres das tarefas foi atingido.");
        }
    }

    private void validarCotaAlteracao(Integer idUsuario, long tamanhoAnterior, int tamanhoNovo) {
        long total = tarefaRepository.totalCaracteresPorUsuario(idUsuario);
        long novoTotal = total - tamanhoAnterior + tamanhoNovo;
        // Uma conta legada acima da cota pode reparar seus registros em etapas.
        if (novoTotal > maxStoredChars && novoTotal >= total) {
            throw new IllegalArgumentException("O limite de caracteres das tarefas foi atingido.");
        }
    }

    private String descricaoNormalizada(TarefaRequest request) {
        return request.getDescricao() == null ? null : request.getDescricao().trim();
    }

    private int tamanhoDescricaoNormalizada(TarefaRequest request) {
        String descricao = descricaoNormalizada(request);
        return descricao == null ? 0 : descricao.length();
    }

    private TarefaResponse resposta(
            Tarefa tarefa,
            Integer idUsuario) {

        Disciplina disciplina =
                disciplinaRepository
                        .buscarPorIdEUsuario(
                                tarefa.getIdDisciplina(),
                                idUsuario
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Disciplina não encontrada."
                                )
                        );

        return new TarefaResponse(
                tarefa,
                disciplina.getNome()
        );
    }

    private void preencherDados(
            Tarefa tarefa,
            TarefaRequest request) {

        tarefa.setTitulo(
                request.getTitulo().trim()
        );

        tarefa.setTipo(
                request.getTipo().trim()
        );

        tarefa.setDescricao(descricaoNormalizada(request));

        tarefa.setDataHoraInicio(
                request.getDataHoraInicio()
        );

        tarefa.setDataEntrega(
                request.getDataEntrega()
        );

        tarefa.setPrioridade(
                request.getPrioridade().trim()
        );
    }

    private void bloquearUsuario(
            Integer idUsuario) {

        validarIdUsuario(idUsuario);

        usuarioRepository
                .buscarParaAtualizacao(idUsuario)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Usuário não encontrado."
                        )
                );
    }

    private void validarIdUsuario(
            Integer idUsuario) {

        if (idUsuario == null) {
            throw new IllegalArgumentException(
                    "O usuário é obrigatório."
            );
        }

        if (idUsuario <= 0) {
            throw new IllegalArgumentException(
                    "O usuário informado é inválido."
            );
        }
    }

    private void validarDadosTarefa(
            TarefaRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Informe os dados da tarefa."
            );
        }

        validarIdUsuario(request.getIdUsuario());

        if (request.getIdDisciplina() == null
                || request.getIdDisciplina() <= 0) {

            throw new IllegalArgumentException(
                    "A disciplina é obrigatória."
            );
        }

        // Valide o texto bruto antes de trim, inclusive descricoes so com espacos.
        if (request.getDescricao() != null && request.getDescricao().length() > maxDescription) {
            throw new IllegalArgumentException(
                    "A descrição deve ter até " + maxDescription + " caracteres.");
        }

        if (request.getTitulo() == null
                || request.getTitulo().isBlank()) {

            throw new IllegalArgumentException(
                    "O título da tarefa é obrigatório."
            );
        }

        if (request.getTitulo().trim().length() > 100) {
            throw new IllegalArgumentException(
                    "O título deve ter até 100 caracteres."
            );
        }

        if (request.getTipo() == null
                || request.getTipo().isBlank()) {

            throw new IllegalArgumentException(
                    "O tipo da tarefa é obrigatório."
            );
        }

        if (request.getTipo().trim().length() > 20) {
            throw new IllegalArgumentException(
                    "O tipo deve ter até 20 caracteres."
            );
        }

        if (request.getDataEntrega() == null) {
            throw new IllegalArgumentException(
                    "A data de entrega é obrigatória."
            );
        }

        if (request.getDataHoraInicio() != null
                && request.getDataEntrega()
                .isBefore(request.getDataHoraInicio())) {

            throw new IllegalArgumentException(
                    "A data de entrega não pode ser anterior à data de início."
            );
        }

        if (request.getPrioridade() == null
                || request.getPrioridade().isBlank()) {

            throw new IllegalArgumentException(
                    "A prioridade da tarefa é obrigatória."
            );
        }

        if (request.getPrioridade().trim().length() > 20) {
            throw new IllegalArgumentException(
                    "A prioridade deve ter até 20 caracteres."
            );
        }
    }
}