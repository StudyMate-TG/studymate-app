import {
  apiFetch,
  handleResponse,
} from "./apiClient";

import {
  API_BASE_URL,
} from "./apiConfig";

import {
  agendarNotificacoesAvaliacao,
  cancelarNotificacoesAvaliacao,
} from "./notificacaoService";

export type AvaliacaoRequest = {
  idDisciplina: number;
  nome: string;
  tipo: string;
  nota: number | null;
  peso: number;
  dataAvaliacao: string;
};

export type AvaliacaoResponse = {
  idAvaliacao: number;
  idDisciplina: number;
  nome: string;
  tipo: string;
  nota: number | null;
  peso: number;
  dataAvaliacao: string;
};

export type MediaDisciplinaResponse = {
  media: number | null;
  avaliacoesComNota: number;
  avaliacoesPendentes: number;
};

async function atualizarLembretesAvaliacao(
  avaliacao: AvaliacaoResponse
): Promise<void> {
  try {
    await agendarNotificacoesAvaliacao({
      idAvaliacao:
        avaliacao.idAvaliacao,

      nome:
        avaliacao.nome,

      dataAvaliacao:
        avaliacao.dataAvaliacao,
    });
  } catch (error) {
    console.warn(
      "Não foi possível atualizar os lembretes da avaliação.",
      error
    );
  }
}

export const listarAvaliacoes =
  async (
    idUsuario: number,
    idDisciplina: number
  ): Promise<
    AvaliacaoResponse[]
  > => {
    const params =
      new URLSearchParams({
        idUsuario:
          idUsuario.toString(),

        idDisciplina:
          idDisciplina.toString(),
      });

    const response =
      await apiFetch(
        `${API_BASE_URL}/avaliacoes?${params.toString()}`
      );

    return handleResponse<
      AvaliacaoResponse[]
    >(response);
  };

export const buscarAvaliacaoPorId =
  async (
    idAvaliacao: number,
    idUsuario: number
  ): Promise<
    AvaliacaoResponse
  > => {
    const response =
      await apiFetch(
        `${API_BASE_URL}/avaliacoes/${idAvaliacao}?idUsuario=${idUsuario}`
      );

    return handleResponse<
      AvaliacaoResponse
    >(response);
  };

export const cadastrarAvaliacao =
  async (
    idUsuario: number,
    payload: AvaliacaoRequest
  ): Promise<
    AvaliacaoResponse
  > => {
    const response =
      await apiFetch(
        `${API_BASE_URL}/avaliacoes?idUsuario=${idUsuario}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );

    const avaliacao =
      await handleResponse<
        AvaliacaoResponse
      >(response);

    await atualizarLembretesAvaliacao(
      avaliacao
    );

    return avaliacao;
  };

export const atualizarAvaliacao =
  async (
    idAvaliacao: number,
    idUsuario: number,
    payload: AvaliacaoRequest
  ): Promise<
    AvaliacaoResponse
  > => {
    const response =
      await apiFetch(
        `${API_BASE_URL}/avaliacoes/${idAvaliacao}?idUsuario=${idUsuario}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );

    const avaliacao =
      await handleResponse<
        AvaliacaoResponse
      >(response);

    await atualizarLembretesAvaliacao(
      avaliacao
    );

    return avaliacao;
  };

export const excluirAvaliacao =
  async (
    idAvaliacao: number,
    idUsuario: number
  ): Promise<void> => {
    const response =
      await apiFetch(
        `${API_BASE_URL}/avaliacoes/${idAvaliacao}?idUsuario=${idUsuario}`,
        {
          method: "DELETE",
        }
      );

    if (!response.ok) {
      let mensagem =
        "Erro ao excluir avaliação.";

      try {
        const data =
          await response.json();

        if (
          data?.mensagem
        ) {
          mensagem =
            data.mensagem;
        }
      } catch {
        // mantém mensagem padrão
      }

      throw new Error(
        mensagem
      );
    }

    try {
      await cancelarNotificacoesAvaliacao(
        idAvaliacao
      );
    } catch (error) {
      console.warn(
        "Avaliação excluída, mas não foi possível cancelar seus lembretes.",
        error
      );
    }
  };

export const buscarMediaDisciplina =
  async (
    idUsuario: number,
    idDisciplina: number
  ): Promise<
    MediaDisciplinaResponse
  > => {
    const params =
      new URLSearchParams({
        idUsuario:
          idUsuario.toString(),

        idDisciplina:
          idDisciplina.toString(),
      });

    const response =
      await apiFetch(
        `${API_BASE_URL}/avaliacoes/media?${params.toString()}`
      );

    return handleResponse<
      MediaDisciplinaResponse
    >(response);
  };