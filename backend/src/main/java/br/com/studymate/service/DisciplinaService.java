package br.com.studymate.service;

import br.com.studymate.dao.DaoDisciplina;
import br.com.studymate.dto.DisciplinaRequest;
import br.com.studymate.dto.DisciplinaResponse;
import br.com.studymate.model.Disciplina;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DisciplinaService {

    private final DaoDisciplina daoDisciplina;

    public DisciplinaService(DaoDisciplina daoDisciplina) {
        this.daoDisciplina = daoDisciplina;
    }

    public List<DisciplinaResponse> listar(Integer idUsuario, String termo) {
        validarIdUsuario(idUsuario);

        return daoDisciplina.listarPorUsuario(idUsuario, termo)
                .stream()
                .map(DisciplinaResponse::new)
                .toList();
    }

    public DisciplinaResponse consultarPorId(Integer idDisciplina, Integer idUsuario) {
        validarIdUsuario(idUsuario);

        Disciplina disciplina = daoDisciplina.consultarPorIdEUsuario(idDisciplina, idUsuario);

        if (disciplina == null) {
            throw new IllegalArgumentException("Disciplina não encontrada.");
        }

        return new DisciplinaResponse(disciplina);
    }

    public DisciplinaResponse cadastrar(DisciplinaRequest request) {
        validarIdUsuario(request.getIdUsuario());
        validarDadosDisciplina(request);

        Integer idPeriodo = daoDisciplina.obterOuCriarPeriodoPadrao(request.getIdUsuario());

        Disciplina disciplina = new Disciplina(
                idPeriodo,
                request.getNome().trim(),
                request.getProfessor().trim()
        );

        disciplina.setMediaAprovacao(request.getMediaAprovacao());
        disciplina.setLimiteFaltas(request.getLimiteFaltas());

        Disciplina disciplinaCadastrada = daoDisciplina.inserir(disciplina);

        return new DisciplinaResponse(disciplinaCadastrada);
    }

    public DisciplinaResponse alterar(
            Integer idDisciplina,
            Integer idUsuario,
            DisciplinaRequest request
    ) {
        validarIdUsuario(idUsuario);
        validarDadosDisciplina(request);

        Disciplina disciplinaExistente = daoDisciplina.consultarPorIdEUsuario(idDisciplina, idUsuario);

        if (disciplinaExistente == null) {
            throw new IllegalArgumentException("Disciplina não encontrada.");
        }

        Disciplina disciplina = new Disciplina(
                disciplinaExistente.getIdPeriodo(),
                request.getNome().trim(),
                request.getProfessor().trim()
        );

        disciplina.setMediaAprovacao(request.getMediaAprovacao());
        disciplina.setLimiteFaltas(request.getLimiteFaltas());

        Disciplina disciplinaAlterada = daoDisciplina.alterar(
                idDisciplina,
                idUsuario,
                disciplina
        );

        return new DisciplinaResponse(disciplinaAlterada);
    }

    public void excluir(Integer idDisciplina, Integer idUsuario) {
        validarIdUsuario(idUsuario);

        Disciplina disciplinaExistente = daoDisciplina.consultarPorIdEUsuario(idDisciplina, idUsuario);

        if (disciplinaExistente == null) {
            throw new IllegalArgumentException("Disciplina não encontrada.");
        }

        boolean excluiu = daoDisciplina.excluir(idDisciplina, idUsuario);

        if (!excluiu) {
            throw new IllegalArgumentException("Não foi possível excluir a disciplina.");
        }
    }

    private void validarIdUsuario(Integer idUsuario) {
        if (idUsuario == null) {
            throw new IllegalArgumentException("O usuário é obrigatório.");
        }

        if (idUsuario <= 0) {
            throw new IllegalArgumentException("O usuário informado é inválido.");
        }
    }

    private void validarDadosDisciplina(DisciplinaRequest request) {
        if (request.getNome() == null || request.getNome().isBlank()) {
            throw new IllegalArgumentException("O nome da disciplina é obrigatório.");
        }

        if (request.getProfessor() == null || request.getProfessor().isBlank()) {
            throw new IllegalArgumentException("O professor da disciplina é obrigatório.");
        }

        if (request.getMediaAprovacao() == null) {
            throw new IllegalArgumentException("A média de aprovação é obrigatória.");
        }

        if (request.getMediaAprovacao() < 0 || request.getMediaAprovacao() > 10) {
            throw new IllegalArgumentException("A média de aprovação deve estar entre 0 e 10.");
        }

        if (request.getLimiteFaltas() == null) {
            throw new IllegalArgumentException("O limite de faltas é obrigatório.");
        }

        if (request.getLimiteFaltas() < 0) {
            throw new IllegalArgumentException("O limite de faltas não pode ser negativo.");
        }
    }
}