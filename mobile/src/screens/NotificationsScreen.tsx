import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { MobileHeader } from "../components/MobileHeader";
import { Button } from "../components/Button";
import type { RootStackScreenProps } from "../types";
import { getSessionGeneration, hasSession, requireSessionUser } from "../services/apiClient";
import { listarNotificacoes, marcarNotificacaoLida } from "../services/centralNotificacoesService";
import { useNotificacoesNaoLidas } from "../hooks/useNotificacoesNaoLidas";

type Filtro = "todas" | "naoLidas" | "lidas";
const dataExibicao = (valor: string): string => new Date(valor).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

export function NotificationsScreen({ navigation }: RootStackScreenProps<"Notifications">) {
  const [page, setPage] = useState(0);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const usuario = hasSession() ? requireSessionUser() : null;
  const client = useQueryClient();
  const total = useNotificacoesNaoLidas();
  const lista = useQuery({
    queryKey: ["notificacoes", usuario, getSessionGeneration(), "lista", page, filtro],
    queryFn: () => listarNotificacoes(page, 20, filtro === "todas" ? undefined : filtro === "lidas"),
    enabled: usuario !== null,
    retry: false,
  });
  useFocusEffect(React.useCallback(() => {
    void lista.refetch();
    void total.refetch();
  }, [lista.refetch, total.refetch]));
  useEffect(() => {
    if (lista.data && page > Math.max(0, lista.data.totalPages - 1)) setPage(Math.max(0, lista.data.totalPages - 1));
  }, [lista.data, page]);
  const leitura = useMutation({
    mutationFn: marcarNotificacaoLida,
    onSuccess: async () => {
      // Refresh the count and filtered page together; marking read is idempotent on the server.
      await client.invalidateQueries({ queryKey: ["notificacoes", usuario] });
      if (filtro === "naoLidas" && page > 0 && lista.data?.content.length === 1) setPage(page - 1);
    },
  });
  const trocarFiltro = (novo: Filtro) => { setPage(0); setFiltro(novo); leitura.reset(); };
  const erro = lista.error ?? leitura.error ?? total.error;
  return (
    <View style={styles.container}>
      <MobileHeader title="Notificações" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Central de notificações</Text>
        <Text style={styles.subtitle}>
          {total.data ? `${total.data.total} não lida${total.data.total === 1 ? "" : "s"}. ` : ""}
          Histórico da sua conta. Horários de São Paulo.
        </Text>
        <Text style={styles.subtitle}>Os lembretes locais do celular continuam disponíveis offline. A central precisa de conexão.</Text>
        <View style={styles.filters}>
          {([["todas", "Todas"], ["naoLidas", "Não lidas"], ["lidas", "Lidas"]] as const).map(([valor, label]) => (
            <Pressable key={valor} onPress={() => trocarFiltro(valor)} accessibilityRole="button"
              accessibilityState={{ selected: filtro === valor }} style={[styles.filter, filtro === valor && styles.selected]}>
              <Text style={{ color: filtro === valor ? "#FFFFFF" : "#334155" }}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {usuario === null ? <Text accessibilityRole="alert" style={styles.error}>Sua sessão expirou. Entre novamente.</Text> : null}
        {erro ? <View style={styles.errorBox}>
          <Text accessibilityRole="alert" style={styles.error}>{erro instanceof Error ? erro.message : "Não foi possível carregar as notificações."}</Text>
          <Button title="Tentar novamente" variant="outline" onPress={() => { leitura.reset(); void lista.refetch(); void total.refetch(); }} />
        </View> : null}
        {lista.isPending ? <ActivityIndicator accessibilityLabel="Carregando notificações" size="large" color="#2563EB" /> : null}
        {!lista.isPending && !lista.error && lista.data?.content.length === 0 ?
          <Text style={styles.empty}>{filtro === "naoLidas" ? "Nenhuma notificação não lida." : "Nenhuma notificação neste filtro."}</Text> : null}
        {lista.data?.content.map((item) => <View key={item.idNotificacao} style={[styles.card, !item.lida && styles.unread]}>
          <Text style={styles.status}>{item.lida ? "Lida" : "Não lida"}</Text>
          <Text style={styles.title}>{item.titulo}</Text>
          <Text style={styles.message}>{item.mensagem}</Text>
          <Text style={styles.date}>{dataExibicao(item.processadoEm ?? item.criadoEm)}</Text>
          {!item.lida ? <Button title="Marcar como lida" variant="outline" size="sm"
            loading={leitura.isPending && leitura.variables === item.idNotificacao}
            disabled={leitura.isPending} onPress={() => leitura.mutate(item.idNotificacao)} /> : null}
        </View>)}
        {lista.data && lista.data.totalPages > 0 ? <View style={styles.pagination}>
          <Button title="Anterior" size="sm" variant="outline" disabled={page === 0 || lista.isFetching} onPress={() => setPage(page - 1)} />
          <Text>Página {page + 1} de {lista.data.totalPages}</Text>
          <Button title="Próxima" size="sm" variant="outline" disabled={page + 1 >= lista.data.totalPages || lista.isFetching} onPress={() => setPage(page + 1)} />
        </View> : null}
        <Button title="Atualizar" variant="ghost" disabled={lista.isFetching} onPress={() => { void lista.refetch(); void total.refetch(); }} />
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 16, paddingBottom: 40, maxWidth: 720, width: "100%", alignSelf: "center", gap: 12 },
  heading: { color: "#0F172A", fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#64748B", fontSize: 14, lineHeight: 20 },
  filters: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filter: { borderRadius: 16, backgroundColor: "#E2E8F0", paddingHorizontal: 14, paddingVertical: 9 },
  selected: { backgroundColor: "#2563EB" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", padding: 16, gap: 10 },
  unread: { backgroundColor: "#EFF6FF", borderColor: "#93C5FD" },
  status: { color: "#2563EB", fontSize: 12, fontWeight: "600" },
  title: { color: "#0F172A", fontSize: 17, fontWeight: "700" },
  message: { color: "#334155", fontSize: 15, lineHeight: 22 },
  date: { color: "#64748B", fontSize: 12 },
  errorBox: { gap: 8, padding: 12, borderRadius: 8, backgroundColor: "#FEF2F2" },
  error: { color: "#B91C1C" },
  empty: { textAlign: "center", paddingVertical: 36, color: "#64748B" },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
});
