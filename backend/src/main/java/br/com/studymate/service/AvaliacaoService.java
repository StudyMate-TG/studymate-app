package br.com.studymate.service;

import br.com.studymate.dto.*;
import br.com.studymate.model.Avaliacao;
import br.com.studymate.repository.AvaliacaoRepository;
import br.com.studymate.repository.DisciplinaRepository;
import br.com.studymate.repository.UsuarioRepository;
import br.com.studymate.exception.AvaliacaoNaoEncontradaException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@Validated
@Transactional(readOnly = true)
public class AvaliacaoService {
    private final AvaliacaoRepository avaliacoes;
    private final DisciplinaRepository disciplinas;
    private final UsuarioRepository usuarios;

    public AvaliacaoService(AvaliacaoRepository avaliacoes, DisciplinaRepository disciplinas,
                            UsuarioRepository usuarios) {
        this.avaliacoes = avaliacoes;
        this.disciplinas = disciplinas;
        this.usuarios = usuarios;
    }

    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public List<AvaliacaoResponse> listar(Integer idDisciplina, Integer idUsuario) {
        validarDisciplina(idDisciplina, idUsuario);
        return avaliacoes.findByIdDisciplinaOrderByDataAvaliacaoDescIdAvaliacaoDesc(idDisciplina)
                .stream().map(AvaliacaoResponse::new).toList();
    }

    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public AvaliacaoResponse consultar(Long idAvaliacao, Integer idUsuario) {
        return new AvaliacaoResponse(buscar(idAvaliacao, idUsuario));
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public AvaliacaoResponse cadastrar(Integer idUsuario, @NotNull @Valid AvaliacaoRequest request) {
        bloquearUsuario(idUsuario);
        validarDisciplina(request.idDisciplina(), idUsuario);
        Avaliacao avaliacao = new Avaliacao();
        preencher(avaliacao, request);
        return new AvaliacaoResponse(avaliacoes.saveAndFlush(avaliacao));
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public AvaliacaoResponse alterar(Long idAvaliacao, Integer idUsuario,
                                      @NotNull @Valid AvaliacaoRequest request) {
        bloquearUsuario(idUsuario);
        Avaliacao avaliacao = buscar(idAvaliacao, idUsuario);
        validarDisciplina(request.idDisciplina(), idUsuario);
        preencher(avaliacao, request);
        return new AvaliacaoResponse(avaliacoes.saveAndFlush(avaliacao));
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public void excluir(Long idAvaliacao, Integer idUsuario) {
        bloquearUsuario(idUsuario);
        avaliacoes.delete(buscar(idAvaliacao, idUsuario));
        avaliacoes.flush();
    }

    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public MediaDisciplinaResponse calcularMedia(Integer idDisciplina, Integer idUsuario) {
        validarDisciplina(idDisciplina, idUsuario);
        List<Avaliacao> lista = avaliacoes.findByIdDisciplinaOrderByDataAvaliacaoDescIdAvaliacaoDesc(idDisciplina);
        BigDecimal soma = BigDecimal.ZERO;
        BigDecimal pesos = BigDecimal.ZERO;
        int corrigidas = 0;
        for (Avaliacao avaliacao : lista) {
            if (avaliacao.getNota() != null) {
                soma = soma.add(avaliacao.getNota().multiply(avaliacao.getPeso()));
                pesos = pesos.add(avaliacao.getPeso());
                corrigidas++;
            }
        }
        BigDecimal media = corrigidas == 0 ? null : soma.divide(pesos, 2, RoundingMode.HALF_UP);
        return new MediaDisciplinaResponse(idDisciplina, media, corrigidas, lista.size() - corrigidas);
    }

    private Avaliacao buscar(Long id, Integer usuario) {
        validarUsuario(usuario);
        if (id == null || id <= 0) throw new IllegalArgumentException("A avaliação informada é inválida.");
        return avaliacoes.buscarDoUsuario(id, usuario).orElseThrow(AvaliacaoNaoEncontradaException::new);
    }

    private void validarDisciplina(Integer id, Integer usuario) {
        validarUsuario(usuario);
        if (id == null || id <= 0) throw new IllegalArgumentException("A disciplina informada é inválida.");
        disciplinas.buscarPorIdEUsuario(id, usuario)
                .orElseThrow(() -> new IllegalArgumentException("Disciplina não encontrada para o usuário informado."));
    }

    private void bloquearUsuario(Integer id) {
        validarUsuario(id);
        usuarios.buscarParaAtualizacao(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
    }

    private void validarUsuario(Integer id) {
        if (id == null || id <= 0) throw new IllegalArgumentException("O usuário informado é inválido.");
    }

    private void preencher(Avaliacao avaliacao, AvaliacaoRequest request) {
        avaliacao.setIdDisciplina(request.idDisciplina());
        avaliacao.setNome(request.nome().trim());
        avaliacao.setTipo(request.tipo().trim());
        avaliacao.setNota(request.nota());
        avaliacao.setPeso(request.peso());
        avaliacao.setDataAvaliacao(request.dataAvaliacao());
    }
}
