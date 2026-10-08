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

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  RootStackParamList,
  DisciplinaResponse,
} from "../types";

import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

import {
  CheckCircle2,
  ChevronDown,
} from "lucide-react-native";

import { cadastrarTarefa } from "../services/tarefaService";

import { obterUsuarioSessao } from "../services/authService";
import { listarDisciplinas } from "../services/disciplinaService";

type Priority = "BAIXA" | "MEDIA" | "ALTA";

const priorityLabels: Record<Priority, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

const priorityColors: Record<Priority, string> = {
  BAIXA: "#22C55E",
  MEDIA: "#EAB308",
  ALTA: "#EF4444",
};

export const NewTaskScreen: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList>
    >();

  const [showSuccess, setShowSuccess] =
    useState(false);

  const [disciplinas, setDisciplinas] =
    useState<DisciplinaResponse[]>([]);

  const [
    idDisciplinaSelecionada,
    setIdDisciplinaSelecionada,
  ] = useState<number | null>(null);

  const [
    disciplinasAberta,
    setDisciplinasAberta,
  ] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    dueDate: "",
    priority: "MEDIA" as Priority,
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

  useEffect(() => {
    const carregarDisciplinas =
      async () => {
        try {
          const usuario =
            await obterUsuarioSessao();

          if (!usuario?.idUsuario) {
            throw new Error(
              "Usuário não encontrado. Faça login novamente."
            );
          }

          const dados =
            await listarDisciplinas(
              usuario.idUsuario
            );

          setDisciplinas(dados);
        } catch (error) {
          showAlert(
            "Erro",
            error instanceof Error
              ? error.message
              : "Erro ao carregar disciplinas."
          );
        }
      };

    carregarDisciplinas();
  }, []);

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

  const converterDataParaBackend = (
    data: string
  ) => {
    const valor =
      data.trim();

    const [
      dataParte,
      horaParte = "23:59",
    ] = valor.split(" ");

    const [dia, mes, ano] =
      dataParte.split("/");

    return `${ano}-${mes}-${dia}T${horaParte}:00`;
  };

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
      const usuario =
        await obterUsuarioSessao();

      if (!usuario?.idUsuario) {
        showAlert(
          "Erro",
          "Usuário não encontrado. Faça login novamente."
        );

        return;
      }

      await cadastrarTarefa({
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
          form.priority,
      });

      setShowSuccess(true);
    } catch (error) {
      console.error(
        "Erro ao cadastrar tarefa:",
        error
      );

      showAlert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar a tarefa."
      );
    }
  };

  const disciplinaSelecionada =
    disciplinas.find(
      (disciplina) =>
        disciplina.idDisciplina ===
        idDisciplinaSelecionada
    );

  if (showSuccess) {
    return (
      <View style={styles.container}>
        <MobileHeader
          title="Nova Tarefa"
          showBack
          onBack={() =>
            navigation.goBack()
          }
        />

        <View
          style={
            styles.successContainer
          }
        >
          <View
            style={styles.iconCircle}
          >
            <CheckCircle2
              size={64}
              color="#16A34A"
            />
          </View>

          <Text
            style={
              styles.successTitle
            }
          >
            Tarefa registrada com sucesso!
          </Text>

          <Text
            style={
              styles.successSubtitle
            }
          >
            A tarefa foi registrada com sucesso.
          </Text>

          <Button
            title="Voltar"
            onPress={() =>
              navigation.goBack()
            }
            style={styles.backButton}
          />
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
        title="Nova Tarefa"
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

          <Text
            style={styles.sectionLabel}
          >
            Disciplina
          </Text>

          <View
            style={
              styles.dropdownContainer
            }
          >
            <Pressable
              style={
                styles.dropdownButton
              }
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
              <View
                style={
                  styles.dropdownOptions
                }
              >
                {disciplinas.length ===
                0 ? (
                  <View
                    style={
                      styles.dropdownEmpty
                    }
                  >
                    <Text
                      style={
                        styles.dropdownEmptyText
                      }
                    >
                      Nenhuma disciplina disponível.
                    </Text>
                  </View>
                ) : (
                  disciplinas.map(
                    (disciplina) => {
                      const selecionada =
                        idDisciplinaSelecionada ===
                        disciplina.idDisciplina;

                      return (
                        <Pressable
                          key={
                            disciplina.idDisciplina
                          }
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
                              subject:
                                disciplina.nome,
                            });

                            setDisciplinasAberta(
                              false
                            );
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              selecionada &&
                                styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {
                              disciplina.nome
                            }
                          </Text>
                        </Pressable>
                      );
                    }
                  )
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
                "BAIXA",
                "MEDIA",
                "ALTA",
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
              title="Cadastrar"
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

  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },

  successSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
  },

  backButton: {
    width: "100%",
    maxWidth: 240,
  },
});