package br.com.studymate.service;

import br.com.studymate.dto.FaltaRequest;
import br.com.studymate.dto.FaltaResponse;
import br.com.studymate.model.Falta;
import br.com.studymate.repository.DisciplinaRepository;
import br.com.studymate.repository.FaltaRepository;
import br.com.studymate.repository.UsuarioRepository;

import org.springframework.stereotype.Service;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class FaltaService {

    private final FaltaRepository faltaRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final UsuarioRepository usuarios;
    private final NotificacaoService notificacoes;

    public FaltaService(
            FaltaRepository faltaRepository,
            DisciplinaRepository disciplinaRepository,
            UsuarioRepository usuarios, NotificacaoService notificacoes
    ) {
        this.faltaRepository = faltaRepository;
        this.disciplinaRepository = disciplinaRepository;
        this.usuarios = usuarios;
        this.notificacoes = notificacoes;
    }

    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public List<FaltaResponse> listar(
            Integer idDisciplina,
            Integer idUsuario
    ) {
        validarDisciplinaDoUsuario(idDisciplina, idUsuario);

        return faltaRepository
                .findByIdDisciplinaOrderByDataFaltaDescIdFaltaDesc(idDisciplina)
                .stream()
                .map(FaltaResponse::new)
                .toList();
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public FaltaResponse cadastrar(
            Integer idUsuario,
            FaltaRequest request
    ) {
        bloquearUsuario(idUsuario);
        validarRequest(request);

        validarDisciplinaDoUsuario(
                request.getIdDisciplina(),
                idUsuario
        );

        Falta falta = new Falta(
                request.getIdDisciplina(),
                request.getDataFalta(),
                request.getQuantidadeAulas()
        );

        Falta salva = faltaRepository.saveAndFlush(falta);
        notificacoes.reavaliarDisciplina(salva.getIdDisciplina(), idUsuario);
        return new FaltaResponse(salva);
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public FaltaResponse alterar(
            Integer idFalta,
            Integer idUsuario,
            FaltaRequest request
    ) {
        validarIdFalta(idFalta);
        bloquearUsuario(idUsuario);
        validarRequest(request);

        validarDisciplinaDoUsuario(
                request.getIdDisciplina(),
                idUsuario
        );

        Falta falta = faltaRepository.findById(idFalta)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Falta não encontrada."
                        )
                );

        validarDisciplinaDoUsuario(
                falta.getIdDisciplina(),
                idUsuario
        );

        Integer disciplinaAnterior = falta.getIdDisciplina();
        falta.setIdDisciplina(request.getIdDisciplina());
        falta.setDataFalta(request.getDataFalta());
        falta.setQuantidadeAulas(request.getQuantidadeAulas());

        Falta salva = faltaRepository.saveAndFlush(falta);
        notificacoes.reavaliarDisciplina(salva.getIdDisciplina(), idUsuario);
        if (!disciplinaAnterior.equals(salva.getIdDisciplina())) {
            notificacoes.reavaliarDisciplina(disciplinaAnterior, idUsuario);
        }
        return new FaltaResponse(salva);
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public void excluir(
            Integer idFalta,
            Integer idUsuario
    ) {
        bloquearUsuario(idUsuario);
        validarIdFalta(idFalta);

        Falta falta = faltaRepository.findById(idFalta)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Falta não encontrada."
                        )
                );

        validarDisciplinaDoUsuario(
                falta.getIdDisciplina(),
                idUsuario
        );

        faltaRepository.delete(falta);
        faltaRepository.flush();
        notificacoes.reavaliarDisciplina(falta.getIdDisciplina(), idUsuario);
    }

    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public Long totalFaltas(
            Integer idDisciplina,
            Integer idUsuario
    ) {
        validarDisciplinaDoUsuario(idDisciplina, idUsuario);

        return faltaRepository
                .somarFaltasPorDisciplina(idDisciplina);
    }

    private void validarDisciplinaDoUsuario(
            Integer idDisciplina,
            Integer idUsuario
    ) {
        if (idUsuario == null || idUsuario <= 0) {
            throw new IllegalArgumentException(
                    "O usuário informado é inválido."
            );
        }

        if (idDisciplina == null || idDisciplina <= 0) {
            throw new IllegalArgumentException(
                    "A disciplina informada é inválida."
            );
        }

        disciplinaRepository
                .buscarPorIdEUsuario(idDisciplina, idUsuario)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Disciplina não encontrada."
                        )
                );
    }

    private void validarRequest(FaltaRequest request) {
        if (request == null) {
            throw new IllegalArgumentException(
                    "Informe os dados da falta."
            );
        }

        if (
                request.getIdDisciplina() == null ||
                request.getIdDisciplina() <= 0
        ) {
            throw new IllegalArgumentException(
                    "A disciplina é obrigatória."
            );
        }

        if (request.getDataFalta() == null) {
            throw new IllegalArgumentException(
                    "A data da falta é obrigatória."
            );
        }

        if (
                request.getQuantidadeAulas() == null ||
                request.getQuantidadeAulas() <= 0
        ) {
            throw new IllegalArgumentException(
                    "A quantidade de aulas deve ser maior que zero."
            );
        }
    }

    private void bloquearUsuario(Integer idUsuario) {
        if (idUsuario == null || idUsuario <= 0) {
            throw new IllegalArgumentException("O usuário informado é inválido.");
        }
        usuarios.buscarParaAtualizacao(idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
    }

    private void validarIdFalta(Integer idFalta) {
        if (idFalta == null || idFalta <= 0) {
            throw new IllegalArgumentException(
                    "A falta informada é inválida."
            );
        }
    }
}