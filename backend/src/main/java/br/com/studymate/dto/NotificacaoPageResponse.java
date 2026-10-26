package br.com.studymate.dto;

import java.util.List;

public record NotificacaoPageResponse(List<NotificacaoResponse> content, int page, int size,
                                      long totalElements, int totalPages) {}
