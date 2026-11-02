
import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";

import { MobileHeader } from "../components/MobileHeader";
import { Button } from "../components/Button";
import type { RootStackScreenProps } from "../types";

import {
  getSessionGeneration,
  hasSession,
  requireSessionUser,
} from "../services/apiClient";

import {
  listarNotificacoes,
  marcarNotificacaoLida,
} from "../services/centralNotificacoesService";

import { useNotificacoesNaoLidas } from "../hooks/useNotificacoesNaoLidas";

// Formato: dd/MM às HH:mm
const dataExibicao = (valor: string): string => {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  const diaMes = data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  });

  return `${diaMes} às ${hora}`;
};

export function NotificationsScreen({
  navigation,
}: RootStackScreenProps<"Notifications">) {
  const usuario = hasSession() ? requireSessionUser() : null;
  const client = useQueryClient();

  const total = useNotificacoesNaoLidas();

  const lista = useInfiniteQuery({
    queryKey: [
      "notificacoes",
      usuario,
      getSessionGeneration(),
      "naoLidas",
    ],

    initialPageParam: 0,

    // Busca somente notificações ainda não lidas.
    queryFn: ({ pageParam }) =>
      listarNotificacoes(pageParam, 20, false),

    getNextPageParam: (lastPage, allPages) =>
      allPages.length < lastPage.totalPages
        ? allPages.length
        : undefined,

    enabled: usuario !== null,
    retry: false,
  });

  // Atualiza a lista e o contador quando a tela recebe foco.
  useFocusEffect(
    React.useCallback(() => {
      if (usuario !== null) {
        void lista.refetch();
        void total.refetch();
      }
    }, [usuario, lista.refetch, total.refetch])
  );

  // Marca a notificação como lida após o clique.
  const leitura = useMutation({
    mutationFn: marcarNotificacaoLida,

    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: ["notificacoes", usuario],
        }),
        total.refetch(),
      ]);
    },
  });

  const erro = lista.error ?? leitura.error ?? total.error;

  const notificacoes =
    lista.data?.pages.flatMap((pagina) => pagina.content) ?? [];

  const quantidade = total.data?.total;

  return (
    <View style={styles.container}>
      <MobileHeader
        title="Notificações"
        showBack
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={notificacoes}
        keyExtractor={(item) => String(item.idNotificacao)}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator

        onEndReached={() => {
          if (lista.hasNextPage && !lista.isFetchingNextPage) {
            void lista.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}

        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Text style={styles.heading}>
              Notificações
            </Text>

            <Text style={styles.subtitle}>
              {quantidade === undefined
                ? "Carregando contagem..."
                : quantidade === 1
                  ? "1 notificação não lida"
                  : `${quantidade} notificações não lidas`}
            </Text>

            {usuario === null ? (
              <Text accessibilityRole="alert" style={styles.error}>
                Sua sessão expirou. Entre novamente.
              </Text>
            ) : null}

            {erro ? (
              <View style={styles.errorBox}>
                <Text
                  accessibilityRole="alert"
                  style={styles.error}
                >
                  {erro instanceof Error
                    ? erro.message
                    : "Não foi possível carregar as notificações."}
                </Text>

                <Button
                  title="Tentar novamente"
                  variant="outline"
                  onPress={() => {
                    leitura.reset();
                    void lista.refetch();
                    void total.refetch();
                  }}
                />
              </View>
            ) : null}
          </View>
        }

        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => leitura.mutate(item.idNotificacao)}
            disabled={leitura.isPending}
            accessibilityRole="button"
            accessibilityLabel={`Abrir notificação: ${item.titulo}`}
            accessibilityHint="Marca esta notificação como lida."
          >
            <View style={styles.cardHeader}>
              <View style={styles.unreadIndicator} />

              <Text style={styles.status}>
                Não lida
              </Text>

              {leitura.isPending &&
              leitura.variables === item.idNotificacao ? (
                <ActivityIndicator
                  size="small"
                  color="#2563EB"
                />
              ) : null}
            </View>

            <Text style={styles.title}>
              {item.titulo}
            </Text>

            <Text style={styles.message}>
              {item.mensagem}
            </Text>

            <Text style={styles.date}>
              {dataExibicao(item.processadoEm ?? item.criadoEm)}
            </Text>

            <Text style={styles.actionHint}>
              Toque para marcar como lida
            </Text>
          </Pressable>
        )}

        ListEmptyComponent={
          usuario !== null &&
          !lista.isPending &&
          !erro ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>✓</Text>

              <Text style={styles.emptyTitle}>
                Tudo em dia!
              </Text>

              <Text style={styles.empty}>
                Você não possui notificações pendentes.
              </Text>
            </View>
          ) : undefined
        }

        ListFooterComponent={
          <View style={styles.footer}>
            {lista.isPending || lista.isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color="#2563EB"
              />
            ) : null}

            {lista.isFetchingNextPage ? (
              <Text style={styles.loadingText}>
                Carregando mais notificações...
              </Text>
            ) : null}

            <Button
              title="Atualizar"
              variant="ghost"
              disabled={lista.isFetching}
              onPress={() => {
                void lista.refetch();
                void total.refetch();
              }}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
    gap: 12,
  },

  headerContent: {
    gap: 12,
  },

  heading: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "700",
  },

  subtitle: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 16,
    gap: 10,
  },

  cardPressed: {
    backgroundColor: "#DBEAFE",
    opacity: 0.8,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  unreadIndicator: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#2563EB",
  },

  status: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },

  title: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "700",
  },

  message: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 22,
  },

  date: {
    color: "#64748B",
    fontSize: 12,
  },

  actionHint: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },

  errorBox: {
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },

  error: {
    color: "#B91C1C",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
  },

  emptyIcon: {
    fontSize: 36,
    color: "#16A34A",
    fontWeight: "700",
  },

  emptyTitle: {
    color: "#0F172A",
    fontSize: 19,
    fontWeight: "700",
  },

  empty: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 14,
  },

  footer: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },

  loadingText: {
    color: "#64748B",
    fontSize: 13,
  },
});
