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

    public List<DisciplinaResponse> listar(String termo) {
        return daoDisciplina.listar(termo)
                .stream()
                .map(DisciplinaResponse::new)
                .toList();
    }

    public DisciplinaResponse consultarPorId(Integer idDisciplina) {
        Disciplina disciplina = daoDisciplina.consultarPorId(idDisciplina);

        if (disciplina == null) {
            throw new IllegalArgumentException("Disciplina não encontrada.");
        }

        return new DisciplinaResponse(disciplina);
    }

    public DisciplinaResponse cadastrar(DisciplinaRequest request) {
        validarDisciplina(request);

        Disciplina disciplina = new Disciplina(
        request.getIdPeriodo(),
        request.getNome(),
        request.getProfessor()
        );

        disciplina.setMediaAprovacao(request.getMediaAprovacao());
        disciplina.setLimiteFaltas(request.getLimiteFaltas());

        Disciplina disciplinaCadastrada = daoDisciplina.inserir(disciplina);

        return new DisciplinaResponse(disciplinaCadastrada);
    }

    public DisciplinaResponse alterar(Integer idDisciplina, DisciplinaRequest request) {
        validarDisciplina(request);

        Disciplina disciplinaExistente = daoDisciplina.consultarPorId(idDisciplina);

        if (disciplinaExistente == null) {
            throw new IllegalArgumentException("Disciplina não encontrada.");
        }

        Disciplina disciplina = new Disciplina(
            request.getIdPeriodo(),
            request.getNome(),
            request.getProfessor()
        );

        disciplina.setMediaAprovacao(request.getMediaAprovacao());
        disciplina.setLimiteFaltas(request.getLimiteFaltas());

        Disciplina disciplinaAlterada = daoDisciplina.alterar(idDisciplina, disciplina);

        return new DisciplinaResponse(disciplinaAlterada);
    }

    public void excluir(Integer idDisciplina) {
        Disciplina disciplinaExistente = daoDisciplina.consultarPorId(idDisciplina);

        if (disciplinaExistente == null) {
            throw new IllegalArgumentException("Disciplina não encontrada.");
        }

        boolean excluiu = daoDisciplina.excluir(idDisciplina);

        if (!excluiu) {
            throw new IllegalArgumentException("Não foi possível excluir a disciplina.");
        }
    }

    private void validarDisciplina(DisciplinaRequest request) {
        if (request.getIdPeriodo() == null) {
            throw new IllegalArgumentException("O período letivo é obrigatório.");
        }

        if (request.getNome() == null || request.getNome().isBlank()) {
            throw new IllegalArgumentException("O nome da disciplina é obrigatório.");
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