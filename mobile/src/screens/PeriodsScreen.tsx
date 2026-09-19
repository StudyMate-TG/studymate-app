import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react-native";

import type {
  PeriodoLetivoResponse,
  RootStackScreenProps,
} from "../types";

import { obterUsuarioSessao } from "../services/authService";

import {
  ativarPeriodoLetivo,
  excluirPeriodoLetivo,
  listarPeriodosLetivos,
} from "../services/periodoLetivoService";

type Props = RootStackScreenProps<"Periods">;

export const PeriodsScreen: React.FC<Props> = ({ navigation }) => {
  const [idUsuario, setIdUsuario] = useState<number | null>(null);
  const [periodos, setPeriodos] = useState<PeriodoLetivoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const carregarPeriodos = useCallback(async () => {
    try {
      setIsLoading(true);

      const usuario = await obterUsuarioSessao();

      if (!usuario) {
        navigation.replace("Login");
        return;
      }

      setIdUsuario(usuario.idUsuario);

      const dados = await listarPeriodosLetivos(usuario.idUsuario);

      setPeriodos(dados);
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível carregar os períodos letivos.";

      Alert.alert("Erro", mensagem);
    } finally {
      setIsLoading(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      carregarPeriodos();
    }, [carregarPeriodos])
  );

  const formatarData = (data: string) => {
    if (!data) {
      return "-";
    }

    const partes = data.split("-");

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const ativarPeriodo = async (periodo: PeriodoLetivoResponse) => {
    if (!idUsuario || periodo.status === "ATIVO") {
      return;
    }

    try {
      setIsProcessing(true);

      await ativarPeriodoLetivo(periodo.idPeriodo, idUsuario);

      await carregarPeriodos();
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível ativar o período letivo.";

      Alert.alert("Erro", mensagem);
    } finally {
      setIsProcessing(false);
    }
  };

 const excluirPeriodo = async (periodo: PeriodoLetivoResponse) => {
  if (isProcessing) {
    return;
  }

  if (!idUsuario) {
    Alert.alert("Erro", "Usuário não identificado.");
    return;
  }

  try {
    setIsProcessing(true);

    await excluirPeriodoLetivo(periodo.idPeriodo, idUsuario);

    await carregarPeriodos();
  } catch (erro) {
    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Não foi possível excluir o período letivo.";

    Alert.alert("Erro", mensagem);
  } finally {
    setIsProcessing(false);
  }
};

const confirmarExclusao = (periodo: PeriodoLetivoResponse) => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const confirmou = window.confirm(
      `Deseja excluir o período "${periodo.nome}"?`
    );

    if (confirmou) {
      excluirPeriodo(periodo);
    }

    return;
  }

  Alert.alert(
    "Excluir período",
    `Deseja excluir o período "${periodo.nome}"?`,
    [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => excluirPeriodo(periodo),
      },
    ]
  );
};

  const renderPeriodo = ({ item }: { item: PeriodoLetivoResponse }) => {
    const isAtivo = item.status === "ATIVO";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <CalendarDays size={22} color="#2563EB" />
          </View>

          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{item.nome}</Text>

            <Text style={styles.cardSubtitle}>
              {formatarData(item.dataInicio)} até {formatarData(item.dataFim)}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isAtivo ? styles.statusBadgeActive : styles.statusBadgeInactive,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isAtivo ? styles.statusTextActive : styles.statusTextInactive,
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          {!isAtivo && (
            <Pressable
              disabled={isProcessing}
              onPress={() => ativarPeriodo(item)}
              style={[styles.actionButton, styles.activateButton]}
            >
              <CheckCircle2 size={16} color="#16A34A" />
              <Text style={styles.activateButtonText}>Ativar</Text>
            </Pressable>
          )}

          <Pressable
            disabled={isProcessing}
            onPress={() => confirmarExclusao(item)}
            style={[styles.actionButton, styles.deleteButton]}
          >
            <Trash2 size={16} color="#DC2626" />
            <Text style={styles.deleteButtonText}>Excluir</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#0F172A" />
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Meus Períodos</Text>
          <Text style={styles.subtitle}>
            Organize suas disciplinas por período letivo.
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={periodos}
            keyExtractor={(item) => String(item.idPeriodo)}
            renderItem={renderPeriodo}
            contentContainerStyle={
              periodos.length === 0
                ? styles.emptyListContainer
                : styles.listContainer
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <CalendarDays size={42} color="#94A3B8" />

                <Text style={styles.emptyTitle}>
                  Nenhum período cadastrado
                </Text>

                <Text style={styles.emptyText}>
                  Cadastre seu primeiro período letivo para organizar suas
                  disciplinas.
                </Text>
              </View>
            }
          />
        )}
      </View>

      <Pressable
        onPress={() => navigation.navigate("NewPeriod")}
        style={styles.fab}
      >
        <Plus size={26} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#F1F5F9",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    color: "#64748B",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyListContainer: {
    flexGrow: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    maxWidth: 300,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#DBEAFE",
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#64748B",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusBadgeActive: {
    backgroundColor: "#DCFCE7",
  },
  statusBadgeInactive: {
    backgroundColor: "#F1F5F9",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusTextActive: {
    color: "#15803D",
  },
  statusTextInactive: {
    color: "#475569",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  activateButton: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  activateButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16A34A",
  },
  deleteButton: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  fab: {
    position: "absolute",
    right: 22,
    bottom: 28,
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: "#2563EB",
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});