import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import {
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  RootStackParamList,
  DisciplinaResponse,
} from "../types";

import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

import { obterUsuarioSessao } from "../services/authService";
import { listarDisciplinas } from "../services/disciplinaService";
import { ChevronDown } from "lucide-react-native";
import {
  buscarTarefaPorId,
  atualizarTarefa,
  excluirTarefa,
} from "../services/tarefaService";

type Priority = "low" | "medium" | "high";

const priorityLabels: Record<Priority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const priorityColors: Record<Priority, string> = {
  low: "#22C55E",
  medium: "#EAB308",
  high: "#EF4444",
};

export const EditTaskScreen: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList>
    >();

  const route =
    useRoute<
      RouteProp<RootStackParamList, "EditTask">
    >();

  const { idTarefa, localId } = route.params;

  const referencia = {
    idTarefa,
    localId,
  };

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [excluindo, setExcluindo] =
    useState(false);

  const [disciplinas, setDisciplinas] =
    useState<DisciplinaResponse[]>([]);

  const [
    idDisciplinaSelecionada,
    setIdDisciplinaSelecionada,
  ] = useState<number | null>(null);

  const [disciplinasAberta, setDisciplinasAberta] =
  useState(false);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    dueDate: "",
    priority: "medium" as Priority,
    description: "",
  });

  const showAlert = (
    title: string,
    message: string
  ) => {
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined"
    ) {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Converte:
  // 2026-10-05T23:00:00
  // para:
  // 05/10/2026 23:00
  const formatarDataParaFormulario = (
    data: string
  ) => {
    if (!data) {
      return "";
    }

    const [dataParte, horaParte] =
      data.split("T");

    const [ano, mes, dia] =
      dataParte.split("-");

    if (!ano || !mes || !dia) {
      return data;
    }

    if (!horaParte) {
      return `${dia}/${mes}/${ano}`;
    }

    const hora =
      horaParte.substring(0, 5);

    return `${dia}/${mes}/${ano} ${hora}`;
  };

  // Converte:
  // 05/10/2026 23:00
  // para:
  // 2026-10-05T23:00:00
  const converterDataParaBackend = (
    data: string
  ) => {
    const valor = data.trim();

    const [
      dataParte,
      horaParte = "23:59",
    ] = valor.split(" ");

    const [dia, mes, ano] =
      dataParte.split("/");

    return `${ano}-${mes}-${dia}T${horaParte}:00`;
  };

  const isValidDateTime = (
    value: string
  ) => {
    const regex =
      /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/;

    const match =
      value.match(regex);

    if (!match) {
      return false;
    }

    const day =
      Number(match[1]);

    const month =
      Number(match[2]);

    const year =
      Number(match[3]);

    const hour =
      match[4]
        ? Number(match[4])
        : 0;

    const minute =
      match[5]
        ? Number(match[5])
        : 0;

    if (
      day < 1 ||
      month < 1 ||
      month > 12 ||
      year < 1900 ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      return false;
    }

    const date = new Date(
      year,
      month - 1,
      day,
      hour,
      minute
    );

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      date.getHours() === hour &&
      date.getMinutes() === minute
    );
  };

  // Carrega a tarefa e as disciplinas.
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);

        const usuario =
          await obterUsuarioSessao();

        if (!usuario?.idUsuario) {
          showAlert(
            "Erro",
            "Usuário não encontrado. Faça login novamente."
          );

          navigation.goBack();
          return;
        }

        const [
          tarefa,
          disciplinasUsuario,
        ] = await Promise.all([
          buscarTarefaPorId(
            referencia,
            usuario.idUsuario
          ),

          listarDisciplinas(
            usuario.idUsuario
          ),
        ]);

        setDisciplinas(
          disciplinasUsuario
        );

        setIdDisciplinaSelecionada(
          tarefa.idDisciplina
        );

        const prioridade =
          tarefa.prioridade
            ?.toLowerCase();

        const prioridadeFormulario: Priority =
          prioridade === "low" ||
          prioridade === "medium" ||
          prioridade === "high"
            ? prioridade
            : "medium";

    const disciplina =
      disciplinasUsuario.find(
        (item: DisciplinaResponse) =>
          item.idDisciplina ===
          tarefa.idDisciplina
      );

        setForm({
          title:
            tarefa.titulo || "",

          subject:
            disciplina?.nome || "",

          dueDate:
            formatarDataParaFormulario(
              tarefa.dataEntrega
            ),

          priority:
            prioridadeFormulario,

          description:
            tarefa.descricao || "",
        });
      } catch (error) {
        console.error(
          "Erro ao carregar tarefa:",
          error
        );

        showAlert(
          "Erro",
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a tarefa."
        );
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [idTarefa, localId]);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      showAlert(
        "Atenção",
        "Informe o título da tarefa."
      );

      return;
    }

    if (
      idDisciplinaSelecionada === null
    ) {
      showAlert(
        "Atenção",
        "Selecione uma disciplina."
      );

      return;
    }

    if (!form.dueDate.trim()) {
      showAlert(
        "Atenção",
        "Informe a data de entrega."
      );

      return;
    }

    if (
      !isValidDateTime(
        form.dueDate.trim()
      )
    ) {
      showAlert(
        "Atenção",
        "Informe a data no formato DD/MM/AAAA ou DD/MM/AAAA HH:mm."
      );

      return;
    }

    try {
      setSalvando(true);

      const usuario =
        await obterUsuarioSessao();

      if (!usuario?.idUsuario) {
        showAlert(
          "Erro",
          "Usuário não encontrado. Faça login novamente."
        );

        return;
      }

      await atualizarTarefa(
        referencia,
        usuario.idUsuario,
        {
          idUsuario:
            usuario.idUsuario,

          idDisciplina:
            idDisciplinaSelecionada,

          titulo:
            form.title,

          tipo:
            "TAREFA",

          descricao:
            form.description,

          dataHoraInicio:
            null,

          dataEntrega:
            converterDataParaBackend(
              form.dueDate
            ),

          prioridade:
            form.priority.toUpperCase(),
        }
      );

      showAlert(
        "Sucesso",
        "Tarefa atualizada com sucesso!"
      );

      navigation.goBack();
    } catch (error) {
      console.error(
        "Erro ao atualizar tarefa:",
        error
      );

      showAlert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a tarefa."
      );
    } finally {
      setSalvando(false);
    }
  };

  const executarExclusao =
    async () => {
      try {
        setExcluindo(true);

        const usuario =
          await obterUsuarioSessao();

        if (!usuario?.idUsuario) {
          showAlert(
            "Erro",
            "Usuário não encontrado. Faça login novamente."
          );

          return;
        }

        await excluirTarefa(
          referencia,
          usuario.idUsuario
        );

        showAlert(
          "Sucesso",
          "Tarefa excluída com sucesso!"
        );

        navigation.goBack();
      } catch (error) {
        console.error(
          "Erro ao excluir tarefa:",
          error
        );

        showAlert(
          "Erro",
          error instanceof Error
            ? error.message
            : "Não foi possível excluir a tarefa."
        );
      } finally {
        setExcluindo(false);
      }
    };

  const handleExcluir = () => {
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined"
    ) {
      const confirmou =
        window.confirm(
          "Tem certeza que deseja excluir esta tarefa?"
        );

      if (confirmou) {
        executarExclusao();
      }

      return;
    }

    Alert.alert(
      "Excluir tarefa",
      "Tem certeza que deseja excluir esta tarefa? Essa ação não poderá ser desfeita.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress:
            executarExclusao,
        },
      ]
    );
  };

  const disciplinaSelecionada =
  disciplinas.find(
    (disciplina) =>
      disciplina.idDisciplina ===
      idDisciplinaSelecionada
  );

  if (carregando) {
    return (
      <View style={styles.container}>
        <MobileHeader
          title="Editar Tarefa"
          showBack
          onBack={() =>
            navigation.goBack()
          }
        />

        <View
          style={
            styles.loadingContainer
          }
        >
          <Text
            style={styles.loadingText}
          >
            Carregando tarefa...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
      style={styles.container}
    >
      <MobileHeader
        title="Editar Tarefa"
        showBack
        onBack={() =>
          navigation.goBack()
        }
      />

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.formCard}>
          <Input
            label="Título da Tarefa"
            placeholder="Ex: Entrega do trabalho"
            value={form.title}
            onChangeText={(text) =>
              setForm({
                ...form,
                title: text,
              })
            }
          />
        <Text style={styles.sectionLabel}>
          Disciplina
        </Text>

        <View style={styles.dropdownContainer}>
          <Pressable
            style={styles.dropdownButton}
            onPress={() =>
              setDisciplinasAberta(
                !disciplinasAberta
              )
            }
          >
            <Text
              style={[
                styles.dropdownButtonText,
                !disciplinaSelecionada &&
                  styles.dropdownPlaceholder,
              ]}
            >
              {disciplinaSelecionada
                ? disciplinaSelecionada.nome
                : "Selecione uma disciplina"}
            </Text>

            <View
              style={
                disciplinasAberta
                  ? styles.chevronOpen
                  : undefined
              }
            >
              <ChevronDown
                size={20}
                color="#64748B"
              />
            </View>
          </Pressable>

          {disciplinasAberta && (
            <View style={styles.dropdownOptions}>
              {disciplinas.length === 0 ? (
                <View style={styles.dropdownEmpty}>
                  <Text style={styles.dropdownEmptyText}>
                    Nenhuma disciplina disponível.
                  </Text>
                </View>
              ) : (
                disciplinas.map((disciplina) => {
                  const selecionada =
                    idDisciplinaSelecionada ===
                    disciplina.idDisciplina;

                  return (
                    <Pressable
                      key={disciplina.idDisciplina}
                      style={[
                        styles.dropdownOption,
                        selecionada &&
                          styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        setIdDisciplinaSelecionada(
                          disciplina.idDisciplina
                        );

                        setForm({
                          ...form,
                          subject: disciplina.nome,
                        });

                        setDisciplinasAberta(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          selecionada &&
                            styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {disciplina.nome}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          )}
        </View>

          <Input
            label="Data e Hora de Entrega"
            placeholder="Ex: 25/11/2026 23:59"
            value={form.dueDate}
            onChangeText={(text) =>
              setForm({
                ...form,
                dueDate: text,
              })
            }
          />

          <Text
            style={styles.sectionLabel}
          >
            Prioridade
          </Text>

          <View
            style={styles.priorityRow}
          >
            {(
              [
                "low",
                "medium",
                "high",
              ] as const
            ).map((priority) => {
              const isSelected =
                form.priority ===
                priority;

              return (
                <Pressable
                  key={priority}
                  onPress={() =>
                    setForm({
                      ...form,
                      priority,
                    })
                  }
                  style={[
                    styles.priorityButton,
                    isSelected && {
                      borderColor:
                        priorityColors[
                          priority
                        ],
                      backgroundColor:
                        "#F8FAFC",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.priorityDot,
                      {
                        backgroundColor:
                          priorityColors[
                            priority
                          ],
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.priorityText,
                      isSelected &&
                        styles.priorityTextSelected,
                    ]}
                  >
                    {
                      priorityLabels[
                        priority
                      ]
                    }
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Input
            label="Descrição (Opcional)"
            placeholder="Detalhes sobre a tarefa..."
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(text) =>
              setForm({
                ...form,
                description: text,
              })
            }
            style={styles.textArea}
          />

          <Button
            title={
              excluindo
                ? "Excluindo..."
                : "Excluir tarefa"
            }
            variant="outline"
            onPress={handleExcluir}
            style={
              styles.deleteButton
            }
          />

          <View
            style={
              styles.actionButtons
            }
          >
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() =>
                navigation.goBack()
              }
              style={
                styles.cancelButton
              }
            />

            <Button
              title={
                salvando
                  ? "Salvando..."
                  : "Salvar alterações"
              }
              onPress={handleSubmit}
              style={
                styles.submitButton
              }
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },

  formCard: {
    padding: 20,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 8,
  },

  dropdownContainer: {
  marginBottom: 16,
},

dropdownButton: {
  minHeight: 48,
  paddingHorizontal: 14,
  borderWidth: 1,
  borderColor: "#E2E8F0",
  borderRadius: 10,
  backgroundColor: "#FFFFFF",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

dropdownButtonText: {
  flex: 1,
  fontSize: 14,
  color: "#0F172A",
},

dropdownPlaceholder: {
  color: "#94A3B8",
},

chevronOpen: {
  transform: [
    {
      rotate: "180deg",
    },
  ],
},

dropdownOptions: {
  marginTop: 6,
  borderWidth: 1,
  borderColor: "#E2E8F0",
  borderRadius: 10,
  backgroundColor: "#FFFFFF",
  overflow: "hidden",
},

dropdownOption: {
  paddingHorizontal: 14,
  paddingVertical: 13,
  borderBottomWidth: 1,
  borderBottomColor: "#F1F5F9",
},

dropdownOptionSelected: {
  backgroundColor: "#EFF6FF",
},

dropdownOptionText: {
  fontSize: 14,
  color: "#334155",
},

dropdownOptionTextSelected: {
  color: "#2563EB",
  fontWeight: "600",
},

dropdownEmpty: {
  padding: 14,
},

dropdownEmptyText: {
  fontSize: 14,
  color: "#94A3B8",
},
  
  priorityRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },

  priorityButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },

  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  priorityText: {
    fontSize: 13,
    color: "#64748B",
  },

  priorityTextSelected: {
    fontWeight: "700",
    color: "#0F172A",
  },

  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  cancelButton: {
    flex: 1,
  },

  submitButton: {
    flex: 1,
  },

  deleteButton: {
    marginTop: 12,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loadingText: {
    fontSize: 14,
    color: "#64748B",
  },
});