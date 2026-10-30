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
import java.util.List;

@Service
@Validated
@Transactional(readOnly = true)
public class AvaliacaoService {
    private final AvaliacaoRepository avaliacoes;
    private final DisciplinaRepository disciplinas;
    private final UsuarioRepository usuarios;
    private final NotificacaoService notificacoes;

    public AvaliacaoService(AvaliacaoRepository avaliacoes, DisciplinaRepository disciplinas,
                            UsuarioRepository usuarios, NotificacaoService notificacoes) {
        this.avaliacoes = avaliacoes;
        this.disciplinas = disciplinas;
        this.usuarios = usuarios;
        this.notificacoes = notificacoes;
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
        Avaliacao salva = avaliacoes.saveAndFlush(avaliacao);
        notificacoes.sincronizarAvaliacao(salva, idUsuario);
        notificacoes.reavaliarDisciplina(salva.getIdDisciplina(), idUsuario);
        return new AvaliacaoResponse(salva);
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public AvaliacaoResponse alterar(Long idAvaliacao, Integer idUsuario,
                                      @NotNull @Valid AvaliacaoRequest request) {
        bloquearUsuario(idUsuario);
        Avaliacao avaliacao = buscar(idAvaliacao, idUsuario);
        Integer disciplinaAnterior = avaliacao.getIdDisciplina();
        validarDisciplina(request.idDisciplina(), idUsuario);
        preencher(avaliacao, request);
        Avaliacao salva = avaliacoes.saveAndFlush(avaliacao);
        notificacoes.sincronizarAvaliacao(salva, idUsuario);
        notificacoes.reavaliarDisciplina(salva.getIdDisciplina(), idUsuario);
        if (!disciplinaAnterior.equals(salva.getIdDisciplina())) {
            notificacoes.reavaliarDisciplina(disciplinaAnterior, idUsuario);
        }
        return new AvaliacaoResponse(salva);
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public void excluir(Long idAvaliacao, Integer idUsuario) {
        bloquearUsuario(idUsuario);
        Avaliacao avaliacao = buscar(idAvaliacao, idUsuario);
        notificacoes.excluirAvaliacao(idAvaliacao, idUsuario);
        avaliacoes.delete(avaliacao);
        avaliacoes.flush();
        notificacoes.reavaliarDisciplina(avaliacao.getIdDisciplina(), idUsuario);
    }

    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public MediaDisciplinaResponse calcularMedia(Integer idDisciplina, Integer idUsuario) {
        validarDisciplina(idDisciplina, idUsuario);
        List<Avaliacao> lista = avaliacoes.findByIdDisciplinaOrderByDataAvaliacaoDescIdAvaliacaoDesc(idDisciplina);
        return MediaPonderada.calcular(idDisciplina, lista);
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
