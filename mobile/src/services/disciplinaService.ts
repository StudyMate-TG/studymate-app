import { apiFetch, handleResponse } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";

import type { DisciplinaRequest, DisciplinaResponse } from "../types";

import {
  listarDisciplinasLocais,
  salvarCacheDisciplinas,
} from "../database/repositories/disciplinaLocalRepository";

type MensagemResponse = {
  mensagem: string;
};

const buscarDisciplinasRemotas = async (
  idUsuario: number,
  termo?: string
): Promise<DisciplinaResponse[]> => {
  const params = new URLSearchParams();

  params.append(
    "idUsuario",
    String(idUsuario)
  );

  const termoTratado =
    termo?.trim();

  if (termoTratado) {
    params.append(
      "termo",
      termoTratado
    );
  }

  const response = await apiFetch(
    `${API_BASE_URL}/disciplinas?${params.toString()}`
  );

  return handleResponse<
    DisciplinaResponse[]
  >(response);
};

export const listarDisciplinas = async (
  idUsuario: number,
  termo?: string
): Promise<DisciplinaResponse[]> => {
  const termoTratado =
    termo?.trim();

  const disciplinasLocais =
    await listarDisciplinasLocais(
      idUsuario
    );

  const filtrarLocais = (
    disciplinas: DisciplinaResponse[]
  ) => {
    if (!termoTratado) {
      return disciplinas;
    }

    const busca =
      termoTratado.toLocaleLowerCase(
        "pt-BR"
      );

    return disciplinas.filter(
      (disciplina) =>
        disciplina.nome
          .toLocaleLowerCase("pt-BR")
          .includes(busca) ||
        disciplina.professor
          .toLocaleLowerCase("pt-BR")
          .includes(busca)
    );
  };

  /*
   * Já existe cache:
   * devolvemos imediatamente e
   * atualizamos pela API em background.
   */
  if (disciplinasLocais.length > 0) {
    void buscarDisciplinasRemotas(
      idUsuario,
      termoTratado
    )
      .then(async (remotas) => {
        await salvarCacheDisciplinas(
          idUsuario,
          remotas,
          !termoTratado
        );
      })
      .catch((error) => {
        console.warn(
          "Não foi possível atualizar o cache de disciplinas.",
          error
        );
      });

    return filtrarLocais(
      disciplinasLocais
    );
  }

  /*
   * Primeiro carregamento:
   * ainda não há cache, então tentamos
   * buscar a lista no servidor uma vez.
   */
  try {
    const remotas =
      await buscarDisciplinasRemotas(
        idUsuario,
        termoTratado
      );

    await salvarCacheDisciplinas(
      idUsuario,
      remotas,
      !termoTratado
    );

    return remotas;
  } catch (error) {
    console.warn(
      "Backend indisponível e não há disciplinas em cache.",
      error
    );

    return [];
  }
};

export const cadastrarDisciplina = async (
  payload: DisciplinaRequest
): Promise<DisciplinaResponse> => {


  const body = {
    idUsuario: payload.idUsuario,
    idPeriodo: payload.idPeriodo,
    nome: payload.nome.trim(),
    professor: payload.professor.trim(),
    mediaAprovacao: payload.mediaAprovacao,
    limiteFaltas: payload.limiteFaltas,
  };


  const response = await apiFetch(`${API_BASE_URL}/disciplinas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return handleResponse<DisciplinaResponse>(response);
};

export const buscarDisciplinaPorId = async (
  idDisciplina: number,
  idUsuario: number
): Promise<DisciplinaResponse> => {
  const response = await apiFetch(
    `${API_BASE_URL}/disciplinas/${idDisciplina}?idUsuario=${idUsuario}`
  );

  return handleResponse<DisciplinaResponse>(response);
};

export const atualizarDisciplina = async (
  idDisciplina: number,
  idUsuario: number,
  payload: DisciplinaRequest
): Promise<DisciplinaResponse> => {
  const response = await apiFetch(
    `${API_BASE_URL}/disciplinas/${idDisciplina}?idUsuario=${idUsuario}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idUsuario: payload.idUsuario,
        idPeriodo: payload.idPeriodo,
        nome: payload.nome.trim(),
        professor: payload.professor.trim(),
        mediaAprovacao: payload.mediaAprovacao,
        limiteFaltas: payload.limiteFaltas,
      }),
    }
  );

  return handleResponse<DisciplinaResponse>(response);
};

export const excluirDisciplina = async (
  idDisciplina: number,
  idUsuario: number
): Promise<MensagemResponse> => {
  const response = await apiFetch(
    `${API_BASE_URL}/disciplinas/${idDisciplina}?idUsuario=${idUsuario}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse<MensagemResponse>(response);
};