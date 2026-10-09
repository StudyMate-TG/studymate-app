import React, { useEffect, useMemo, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";

import {
  CompositeNavigationProp,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  MainTabParamList,
  RootStackParamList,
  UsuarioResponse,
} from "../types";

import { obterUsuarioSessao } from "../services/authService";

import * as tarefaService from "../services/tarefaService.web";
import type { TarefaResponse } from "../services/tarefaService.web";

import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { formatarPrioridade } from "../utils/tarefaUtils";

import {
  LastSyncStatus,
} from "../components/LastSyncStatus";

import {
  TaskDeadline,
} from "../components/TaskDeadline";

import {
  ChevronRight,
  Plus,
  ClipboardList,
  CheckCircle2,
  Circle,
} from "lucide-react-native";

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "HomeTab">,
  NativeStackNavigationProp<RootStackParamList>
>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const isFocused = useIsFocused();

  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioResponse | null>(
    null
  );

  const [tarefas, setTarefas] = useState<TarefaResponse[]>([]);

  const [
    tarefaAlterandoStatus,
    setTarefaAlterandoStatus,
  ] = useState<string | null>(null);

  const [
    ultimaSincronizacao,
    setUltimaSincronizacao,
  ] = useState<string | null>(
    null
  );

  const [isActionModalVisible, setIsActionModalVisible] = useState(false);

useEffect(() => {
  const carregarDados = async () => {
    try {
      const usuario = await obterUsuarioSessao();

      setUsuarioLogado(usuario);

      if (!usuario?.idUsuario) {
        setTarefas([]);
        return;
      }

      console.log("ID do usuário na Home:", usuario.idUsuario);

      console.log("Exports do tarefaService:", Object.keys(tarefaService));

      const tarefasDoUsuario =
        await tarefaService.listarTarefas(
          usuario.idUsuario
        );

      console.log(
        "Tarefas recebidas na Home:",
        tarefasDoUsuario
      );

      setTarefas(
        tarefasDoUsuario
      );

      const ultimaSync =
        await tarefaService.obterUltimaSincronizacaoTarefas(
          usuario.idUsuario
        );

      setUltimaSincronizacao(
        ultimaSync
      );

          } catch (error) {
            console.error("Erro ao carregar dados da Home:", error);
            setTarefas([]);
          }
        };

  if (isFocused) {
    carregarDados();
  }
}, [isFocused]);

  const nomeExibicao = useMemo(() => {
    if (!usuarioLogado?.nome) {
      return "estudante";
    }

    return usuarioLogado.nome.trim().split(" ")[0];
  }, [usuarioLogado]);

  const abrirNovaTarefa = () => {
    setIsActionModalVisible(false);
    navigation.navigate("NewTask");
  };

  const abrirNovaFrequencia = () => {
    setIsActionModalVisible(false);
    navigation.navigate("NewAttendance");
  };

  const formatarDataTarefa = (data: string) => {
  if (!data) {
    return "-";
  }

  const [dataParte, horaParte] = data.split("T");
  const [ano, mes, dia] = dataParte.split("-");

  if (!ano || !mes || !dia) {
    return data;
  }

  if (!horaParte) {
    return `${dia}/${mes}/${ano}`;
  }

  const hora = horaParte.substring(0, 5);

  return `${dia}/${mes}/${ano} ${hora}`;
};

  const obterChaveTarefa = (
    tarefa: TarefaResponse
  ) =>
    tarefa.localId ??
    String(tarefa.idTarefa);

const handleAlternarStatusTarefa = async (
  tarefa: TarefaResponse
) => {
  if (!usuarioLogado?.idUsuario) {
    return;
  }

  const chave =
    obterChaveTarefa(tarefa);

  const concluida =
    tarefa.status?.toUpperCase() ===
    "CONCLUIDA";

  try {
    setTarefaAlterandoStatus(chave);

    const tarefaAtualizada =
      concluida
        ? await tarefaService.reabrirTarefa(
            {
              idTarefa:
                tarefa.idTarefa,
              localId:
                tarefa.localId,
            },
            usuarioLogado.idUsuario
          )
        : await tarefaService.concluirTarefa(
            {
              idTarefa:
                tarefa.idTarefa,
              localId:
                tarefa.localId,
            },
            usuarioLogado.idUsuario
          );

    setTarefas((tarefasAtuais) =>
      tarefasAtuais.map((item) =>
        obterChaveTarefa(item) === chave
          ? tarefaAtualizada
          : item
      )
    );
  } catch (error) {
    console.error(
      concluida
        ? "Erro ao reabrir tarefa:"
        : "Erro ao concluir tarefa:",
      error
    );
  } finally {
    setTarefaAlterandoStatus(null);
  }
};

  return (
    <View style={styles.container}>
      <MobileHeader title="StudyMate" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.welcomeCard}>
          <View style={styles.welcomeRow}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>🎓</Text>
            </View>

            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeTitle}>
                Bem-vindo de volta, {nomeExibicao}!
              </Text>

              <Text style={styles.welcomeSubtitle}>
                Seu progresso acadêmico centralizado.
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoCardText}>
            O resumo acadêmico será exibido após sincronização completa com o backend.
          </Text>
        </Card>

        <Card style={styles.streakCard}>
          <View style={styles.streakRow}>
            <Text style={styles.streakEmoji}>🔥</Text>

            <View style={styles.streakTextContainer}>
              <Text style={styles.streakTitle}>Sequência de estudos</Text>

              <Text style={styles.streakSubtitle}>
                Sua sequência de estudos será exibida após o registro de atividades.
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximas Entregas</Text>

          <Pressable
            onPress={() => navigation.navigate("CalendarTab")}
            style={styles.seeAllButton}
          >
            <Text style={styles.seeAllText}>Ver todas</Text>
            <ChevronRight size={16} color="#2563EB" />
          </Pressable>
        </View>

        {tarefas.length === 0 ? (
  <Card style={styles.infoCard}>
    <Text style={styles.infoCardText}>
      Nenhuma entrega próxima cadastrada.
    </Text>
  </Card>
) : (
  tarefas.map((tarefa) => {
    const concluida =
      tarefa.status?.toUpperCase() ===
      "CONCLUIDA";

    const chave =
      obterChaveTarefa(tarefa);

    const alterandoStatus =
      tarefaAlterandoStatus === chave;

    return (
      <Pressable
        key={chave}
        onPress={() =>
          navigation.navigate(
            "EditTask",
            {
              idTarefa:
                tarefa.idTarefa,
              localId:
                tarefa.localId,
            }
          )
        }
      >
        <Card
          style={[
            styles.taskCard,
            concluida &&
              styles.taskCardCompleted,
          ]}
        >
          <View style={styles.taskHeader}>
           <Pressable
              style={styles.completeButton}
              disabled={alterandoStatus}
              onPress={(event) => {
                event.stopPropagation();

                void handleAlternarStatusTarefa(
                  tarefa
                );
              }}
              hitSlop={8}
            >
              {concluida ? (
                <CheckCircle2
                  size={25}
                  color={
                    alterandoStatus
                      ? "#94A3B8"
                      : "#16A34A"
                  }
                />
              ) : (
                <Circle
                  size={25}
                  color={
                    alterandoStatus
                      ? "#94A3B8"
                      : "#64748B"
                  }
                />
              )}
            </Pressable>

            <View
              style={styles.taskContent}
            >
              <Text
                style={[
                  styles.taskTitle,
                  concluida &&
                    styles.taskTitleCompleted,
                ]}
              >
                {tarefa.titulo}
              </Text>

              <Text
                style={styles.taskSubject}
              >
                {tarefa.nomeDisciplina}
              </Text>

              {concluida && (
                <Text
                  style={
                    styles.completedText
                  }
                >
                  Tarefa concluída
                </Text>
              )}
            </View>

            <View
              style={
                styles.priorityBadge
              }
            >
              <Text
                style={
                  styles.priorityText
                }
              >
                {formatarPrioridade(
                  tarefa.prioridade
                )}
              </Text>
            </View>
          </View>

          <TaskDeadline
            dataEntrega={
              tarefa.dataEntrega
            }
          />
        </Card>
      </Pressable>
    );
  })
)}

      <View style={styles.syncStatusContainer}>
        <LastSyncStatus
          lastSyncAt={ultimaSincronizacao}
        />
      </View>

      </ScrollView>

      <Pressable
        onPress={() => setIsActionModalVisible(true)}
        style={styles.fab}
      >
        <Plus size={24} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={isActionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsActionModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsActionModalVisible(false)}
        >
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>O que deseja cadastrar?</Text>

            <Text style={styles.modalSubtitle}>
              Escolha uma ação rápida para continuar.
            </Text>

            <Button
              title="Nova tarefa"
              icon={<ClipboardList size={18} color="#FFFFFF" />}
              onPress={abrirNovaTarefa}
              style={styles.modalButton}
            />

            <Button
              title="Registrar frequência"
              variant="outline"
              icon={<CheckCircle2 size={18} color="#334155" />}
              onPress={abrirNovaFrequencia}
              style={styles.modalButton}
            />

            <Button
              title="Cancelar"
              variant="ghost"
              onPress={() => setIsActionModalVisible(false)}
              style={styles.cancelModalButton}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 90,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },

  welcomeCard: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    marginBottom: 16,
  },

  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  avatarEmoji: {
    fontSize: 28,
  },

  welcomeTextContainer: {
    flex: 1,
  },

  welcomeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
  },

  welcomeSubtitle: {
    fontSize: 13,
    color: "#3B82F6",
    marginTop: 2,
  },

  infoCard: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  infoCardText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },

  streakCard: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FFEDD5",
    marginBottom: 20,
  },

  streakRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  streakEmoji: {
    fontSize: 32,
    marginRight: 14,
  },

  streakTextContainer: {
    flex: 1,
  },

  streakTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9A3412",
  },

  streakSubtitle: {
    fontSize: 13,
    color: "#C2410C",
    marginTop: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },

  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
    marginRight: 2,
  },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
    padding: 16,
  },

  modalContent: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
    textAlign: "center",
  },

  modalSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 16,
  },

  modalButton: {
    marginBottom: 10,
  },

  cancelModalButton: {
    marginTop: 2,
  },
  taskCard: {
  marginBottom: 12,
},

taskHeader: {
  flexDirection: "row",
  alignItems: "flex-start",
},

taskContent: {
  flex: 1,
  marginRight: 12,
},

taskTitle: {
  fontSize: 16,
  fontWeight: "700",
  color: "#0F172A",
},

taskSubject: {
  fontSize: 13,
  color: "#64748B",
  marginTop: 4,
},

priorityBadge: {
  backgroundColor: "#EFF6FF",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 8,
},

priorityText: {
  fontSize: 11,
  fontWeight: "700",
  color: "#2563EB",
},

completeButton: {
  marginRight: 10,
  marginTop: 1,
  alignItems: "center",
  justifyContent: "center",
},

taskCardCompleted: {
  backgroundColor: "#F8FAFC",
  borderColor: "#DCFCE7",
},

taskTitleCompleted: {
  color: "#64748B",
  textDecorationLine: "line-through",
},

completedText: {
  marginTop: 4,
  fontSize: 12,
  fontWeight: "600",
  color: "#16A34A",
},

syncStatusContainer: {
  marginTop: 8,
  marginBottom: 12,
  alignItems: "center",
},

});