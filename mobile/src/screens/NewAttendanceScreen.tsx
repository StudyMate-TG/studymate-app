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
  ActivityIndicator,
  AppState,
} from "react-native";

import { useNavigation } from "@react-navigation/native";

import type {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import type {
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
  ChevronUp,
  BookOpen,
} from "lucide-react-native";

import { obterUsuarioSessao } from "../services/authService";

import { listarDisciplinas } from "../services/disciplinaService";

import {
  cadastrarFalta,
  buscarTotalFaltas,
} from "../services/faltaService";

import { cadastrarPresenca } from "../services/presencaService";

import {
  formatarDataEstudo,
  obterDataHojeSaoPaulo,
} from "../utils/dataEstudoUtils";

import { verificarNotificacaoFaltas } from "../services/notificacaoService";

export const NewAttendanceScreen: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<
        RootStackParamList
      >
    >();

const [idUsuario, setIdUsuario] = useState<number | null>(null);

const [tipoRegistro, setTipoRegistro] = useState<"PRESENCA" | "FALTA">(
  "PRESENCA"
);

const [xpRecebido, setXpRecebido] = useState(0);

const [dataPresencaHoje, setDataPresencaHoje] = useState(
  obterDataHojeSaoPaulo
);

const [disciplinas, setDisciplinas] = useState<DisciplinaResponse[]>([]);

const [idDisciplina, setIdDisciplina] = useState<number | null>(null);

const [mostrarDisciplinas, setMostrarDisciplinas] = useState(false);

const [dataFalta, setDataFalta] = useState(
  new Date().toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  })
);

const [quantidadeAulas, setQuantidadeAulas] = useState("1");

const [carregando, setCarregando] = useState(true);

const [salvando, setSalvando] = useState(false);

const [showSuccess, setShowSuccess] = useState(false);

useEffect(() => {
  const atualizarDataHoje = () => {
    setDataPresencaHoje(obterDataHojeSaoPaulo());
  };

  const timer = setInterval(atualizarDataHoje, 60_000);

  const subscription = AppState.addEventListener("change", (estado) => {
    if (estado === "active") {
      atualizarDataHoje();
    }
  });

  return () => {
    clearInterval(timer);
    subscription.remove();
  };
}, []);

const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(
        title,
        message
      );
    }
  };

  useEffect(() => {
    let ativo = true;

    const carregarDisciplinas =
      async () => {
        try {
          setCarregando(
            true
          );

          const usuario =
            await obterUsuarioSessao();

          if (
            !usuario?.idUsuario
          ) {
            showAlert(
              "Atenção",
              "Usuário não encontrado. Faça login novamente."
            );

            return;
          }

          if (ativo) {
            setIdUsuario(
              usuario.idUsuario
            );
          }

          const dados =
            await listarDisciplinas(
              usuario.idUsuario
            );

          if (ativo) {
            setDisciplinas(
              dados
            );
          }
        } catch (erro) {
          if (ativo) {
            showAlert(
              "Erro",
              erro instanceof Error
                ? erro.message
                : "Não foi possível carregar as disciplinas."
            );
          }
        } finally {
          if (ativo) {
            setCarregando(
              false
            );
          }
        }
      };

    carregarDisciplinas();

    return () => {
      ativo = false;
    };
  }, []);

  const isValidBrazilianDate = (
    dateString: string
  ) => {
    const regex =
      /^(\d{2})\/(\d{2})\/(\d{4})$/;

    const match =
      dateString.match(regex);

    if (!match) {
      return false;
    }

    const day =
      Number(match[1]);

    const month =
      Number(match[2]);

    const year =
      Number(match[3]);

    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      year < 1900
    ) {
      return false;
    }

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    return (
      date.getFullYear() ===
        year &&
      date.getMonth() ===
        month - 1 &&
      date.getDate() ===
        day
    );
  };

  const converterDataParaApi = (
    data: string
  ) => {
    const [
      dia,
      mes,
      ano,
    ] = data.split("/");

    return `${ano}-${mes}-${dia}`;
  };

const disciplinaSelecionada = disciplinas.find(
  (disciplina) => disciplina.idDisciplina === idDisciplina
);

const handleSubmit = async () => {
  const dataRegistro =
    tipoRegistro === "PRESENCA"
      ? formatarDataEstudo(obterDataHojeSaoPaulo())
      : dataFalta.trim();

  if (!idUsuario) {
    showAlert(
      "Atenção",
      "Usuário não encontrado. Faça login novamente."
    );

    return;
  }

  if (!idDisciplina) {
    showAlert(
      "Atenção",
      "Selecione uma disciplina."
    );

    return;
  }

  if (!dataRegistro) {
    showAlert(
      "Atenção",
      "Informe a data da aula."
    );

    return;
  }

  if (!isValidBrazilianDate(dataRegistro)) {
    showAlert(
      "Atenção",
      "Informe a data no formato DD/MM/AAAA."
    );

    return;
  }

  const quantidade = Number(quantidadeAulas);

  if (
    tipoRegistro === "FALTA" &&
    (
      Number.isNaN(quantidade) ||
      !Number.isInteger(quantidade) ||
      quantidade <= 0
    )
  ) {
    showAlert(
      "Atenção",
      "Informe uma quantidade válida de aulas perdidas."
    );

    return;
  }

  try {
    setSalvando(true);

    const dataApi = converterDataParaApi(dataRegistro);

    if (tipoRegistro === "PRESENCA") {
      const presenca = await cadastrarPresenca(idUsuario, {
        idDisciplina,
        dataPresenca: dataApi,
      });

      setXpRecebido(presenca.xpGerado);
    } else {
      await cadastrarFalta(idUsuario, {
        idDisciplina,
        dataFalta: dataApi,
        quantidadeAulas: quantidade,
      });

      try {
        const totalFaltas = await buscarTotalFaltas(
          idDisciplina,
          idUsuario
        );

        if (disciplinaSelecionada) {
          await verificarNotificacaoFaltas({
            idUsuario,
            idDisciplina,
            nomeDisciplina: disciplinaSelecionada.nome,
            totalFaltas,
            limiteFaltas: disciplinaSelecionada.limiteFaltas ?? 0,
          });
        }
      } catch (notificationError) {
        console.warn(
          "Falta registrada, mas não foi possível verificar o alerta de faltas.",
          notificationError
        );
      }
    }

  setShowSuccess(true);
} catch (erro) {
  showAlert(
    "Erro",
    erro instanceof Error
      ? erro.message
      : "Não foi possível registrar a frequência."
  );
} finally {
  setSalvando(false);
}
};

  if (showSuccess) {
    return (
      <View
        style={
          styles.container
        }
      >
        <MobileHeader
          title="Registrar frequência"
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
            style={
              styles.iconCircle
            }
          >
            <CheckCircle2
              size={64}
              color="#16A34A"
            />
          </View>

          <Text style={styles.successTitle}>
            {tipoRegistro === "PRESENCA"
              ? "Presença registrada!"
              : "Falta registrada com sucesso!"}
          </Text>

          <Text style={styles.successSubtitle}>
            {tipoRegistro === "PRESENCA"
              ? "Sua presença foi registrada em "
              : "A falta foi registrada em "}
            {disciplinaSelecionada?.nome ?? "disciplina selecionada"}.
          </Text>

          {tipoRegistro === "PRESENCA" && xpRecebido > 0 && (
            <View style={styles.xpReward}>
              <Text style={styles.xpRewardText}>
                ✨ +{xpRecebido} XP conquistados
              </Text>

              <Text style={styles.xpRewardCaption}>
                Mais um passo na sua jornada de estudos.
              </Text>
            </View>
          )}

          <Button
            title="Voltar ao Início"
            onPress={() => navigation.navigate("MainTabs")}
            style={styles.backButton}
          />
                  </View>
                </View>
              );
            }

  return (
    <KeyboardAvoidingView
      behavior={
        Platform.OS ===
        "ios"
          ? "padding"
          : undefined
      }
      style={
        styles.container
      }
    >
      <MobileHeader
        title="Registrar frequência"
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
          <Text style={styles.formTitle}>
            Cada aula conta
          </Text>

          <Text style={styles.formSubtitle}>
            Registre sua presença, ganhe XP e mantenha sua ofensiva.
          </Text>

          <View style={styles.typeRow}>
            {(["PRESENCA", "FALTA"] as const).map((tipo) => (
              <Pressable
                key={tipo}
                disabled={salvando}
                accessibilityRole="button"
                accessibilityState={{
                  selected: tipoRegistro === tipo,
                }}
                onPress={() => setTipoRegistro(tipo)}
                style={[
                  styles.typeButton,
                  tipoRegistro === tipo && styles.typeButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.typeText,
                    tipoRegistro === tipo && styles.typeTextSelected,
                  ]}
                >
                  {tipo === "PRESENCA"
                    ? "✓ Estive presente"
                    : "Registrar falta"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionLabel}>
            Disciplina
          </Text>

          {carregando ? (
            <View
              style={
                styles.loadingContainer
              }
            >
              <ActivityIndicator />

              <Text
                style={
                  styles.loadingText
                }
              >
                Carregando
                disciplinas...
              </Text>
            </View>
          ) : disciplinas.length ===
            0 ? (
            <Text
              style={
                styles.emptyText
              }
            >
              Nenhuma disciplina
              cadastrada.
            </Text>
          ) : (
            <>
              <Pressable
                style={
                  styles.selectButton
                }
                onPress={() =>
                  setMostrarDisciplinas(
                    !mostrarDisciplinas
                  )
                }
              >
                <View
                  style={
                    styles.selectContent
                  }
                >
                  <BookOpen
                    size={20}
                    color="#64748B"
                  />

                  <Text
                    style={[
                      styles.selectText,

                      !disciplinaSelecionada &&
                        styles.selectPlaceholder,
                    ]}
                  >
                    {disciplinaSelecionada
                      ? disciplinaSelecionada.nome
                      : "Selecione uma disciplina"}
                  </Text>
                </View>

                {mostrarDisciplinas ? (
                  <ChevronUp
                    size={20}
                    color="#64748B"
                  />
                ) : (
                  <ChevronDown
                    size={20}
                    color="#64748B"
                  />
                )}
              </Pressable>

              {mostrarDisciplinas && (
                <View
                  style={
                    styles.optionsContainer
                  }
                >
                  {disciplinas.map(
                    (
                      disciplina
                    ) => (
                      <Pressable
                        key={
                          disciplina.idDisciplina
                        }
                        style={[
                          styles.disciplinaOption,

                          idDisciplina ===
                            disciplina.idDisciplina &&
                            styles.disciplinaOptionSelected,
                        ]}
                        onPress={() => {
                          setIdDisciplina(
                            disciplina.idDisciplina
                          );

                          setMostrarDisciplinas(
                            false
                          );
                        }}
                      >
                        <Text
                          style={
                            styles.disciplinaNome
                          }
                        >
                          {
                            disciplina.nome
                          }
                        </Text>

                        {disciplina.professor && (
                          <Text
                            style={
                              styles.disciplinaProfessor
                            }
                          >
                            {
                              disciplina.professor
                            }
                          </Text>
                        )}
                      </Pressable>
                    )
                  )}
                </View>
              )}
            </>
          )}

          <View
            style={
              styles.fieldSpacing
            }
          >
            <Input
              label={tipoRegistro === "PRESENCA" ? "Data da presença" : "Data da Falta"}
              placeholder="DD/MM/AAAA"
              
              value={
                tipoRegistro === "PRESENCA"
                  ? formatarDataEstudo(dataPresencaHoje)
                  : dataFalta
              }
              editable={tipoRegistro === "FALTA"}
              onChangeText={setDataFalta}
              />
              </View>

              {tipoRegistro === "FALTA" && (
                <View style={styles.fieldSpacing}>

            <Input
              label="Quantidade de aulas perdidas"
              placeholder="Ex: 2"
              value={
                quantidadeAulas
              }
              onChangeText={
                setQuantidadeAulas
              }
              keyboardType="numeric"
            />
          </View>
        )}

          <Text style={styles.helpText}>
            {tipoRegistro === "PRESENCA"
              ? "Presenças somente hoje, no horário de Brasília: +20 XP uma vez por disciplina. A atividade de hoje mantém sua ofensiva."
              : "Informe quantas aulas foram perdidas nessa data."}
          </Text>

          <Button
            title={
              salvando
                ? "Registrando..."
                : tipoRegistro === "PRESENCA" ? "Registrar presença • +20 XP" : "Registrar Falta"
            }
            onPress={
              handleSubmit
            }
            disabled={
              salvando ||
              carregando ||
              disciplinas.length ===
                0
            }
            style={
              styles.submitButton
            }
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  formTitle: { fontSize: 21, fontWeight: "800", color: "#0F172A", marginBottom: 5 },
  formSubtitle: { fontSize: 13, color: "#64748B", lineHeight: 20, marginBottom: 18 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  typeButton: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" },
  typeButtonSelected: { backgroundColor: "#EFF6FF", borderColor: "#2563EB" },
  typeText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  typeTextSelected: { color: "#2563EB" },
  xpReward: { backgroundColor: "#EFF6FF", borderRadius: 16, padding: 20, marginBottom: 24, width: "100%", maxWidth: 350, alignItems: "center", borderWidth: 1, borderColor: "#BFDBFE" },
  xpRewardText: { color: "#2563EB", fontWeight: "800", fontSize: 20 },
  xpRewardCaption: { color: "#64748B", fontSize: 12, marginTop: 6 },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

    scrollContent: {
      padding: 16,
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

    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 14,
    },

    loadingText: {
      fontSize: 14,
      color: "#64748B",
    },

    emptyText: {
      fontSize: 14,
      color: "#64748B",
      paddingVertical: 12,
    },

    selectButton: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: "#CBD5E1",
      borderRadius: 10,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      backgroundColor:
        "#FFFFFF",
    },

    selectContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },

    selectText: {
      fontSize: 15,
      color: "#0F172A",
      flex: 1,
    },

    selectPlaceholder: {
      color: "#94A3B8",
    },

    optionsContainer: {
      borderWidth: 1,
      borderColor: "#E2E8F0",
      borderRadius: 10,
      marginTop: 6,
      overflow: "hidden",
      backgroundColor:
        "#FFFFFF",
    },

    disciplinaOption: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor:
        "#F1F5F9",
    },

    disciplinaOptionSelected: {
      backgroundColor:
        "#EFF6FF",
    },

    disciplinaNome: {
      fontSize: 15,
      fontWeight: "600",
      color: "#0F172A",
    },

    disciplinaProfessor: {
      fontSize: 13,
      color: "#64748B",
      marginTop: 2,
    },

    fieldSpacing: {
      marginTop: 18,
    },

    helpText: {
      fontSize: 12,
      color: "#64748B",
      marginTop: 8,
    },

    submitButton: {
      marginTop: 20,
    },

    successContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      padding: 24,
    },

    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor:
        "#DCFCE7",
      alignItems: "center",
      justifyContent:
        "center",
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
