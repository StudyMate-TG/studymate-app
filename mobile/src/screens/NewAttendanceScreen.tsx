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
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList, DisciplinaResponse } from "../types";

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

export const NewAttendanceScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [disciplinas, setDisciplinas] = useState<DisciplinaResponse[]>([]);
  const [idDisciplina, setIdDisciplina] = useState<number | null>(null);

  const [mostrarDisciplinas, setMostrarDisciplinas] = useState(false);

  const [dataFalta, setDataFalta] = useState(
    new Date().toLocaleDateString("pt-BR")
  );

  const [quantidadeAulas, setQuantidadeAulas] = useState("1");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    let ativo = true;

    const carregarDisciplinas = async () => {
      try {
        setCarregando(true);

        const usuario = await obterUsuarioSessao();

        if (!usuario) {
          showAlert(
            "Atenção",
            "Usuário não encontrado. Faça login novamente."
          );

          return;
        }

        const dados = await listarDisciplinas(usuario.idUsuario);

        if (ativo) {
          setDisciplinas(dados);
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
          setCarregando(false);
        }
      }
    };

    carregarDisciplinas();

    return () => {
      ativo = false;
    };
  }, []);

  const isValidBrazilianDate = (dateString: string) => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);

    if (!match) {
      return false;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (month < 1 || month > 12 || day < 1 || year < 1900) {
      return false;
    }

    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const converterDataParaApi = (data: string) => {
    const [dia, mes, ano] = data.split("/");

    return `${ano}-${mes}-${dia}`;
  };

  const handleSubmit = async () => {
    if (!idDisciplina) {
      showAlert("Atenção", "Selecione uma disciplina.");
      return;
    }

    if (!dataFalta.trim()) {
      showAlert("Atenção", "Informe a data da falta.");
      return;
    }

    if (!isValidBrazilianDate(dataFalta.trim())) {
      showAlert(
        "Atenção",
        "Informe a data no formato DD/MM/AAAA."
      );

      return;
    }

    const quantidade = Number(quantidadeAulas);

    if (
      Number.isNaN(quantidade) ||
      !Number.isInteger(quantidade) ||
      quantidade <= 0
    ) {
      showAlert(
        "Atenção",
        "Informe uma quantidade válida de aulas perdidas."
      );

      return;
    }

    try {
      setSalvando(true);

      const dataApi = converterDataParaApi(dataFalta.trim());

      console.log("Falta preparada para cadastro:", {
        idDisciplina,
        dataFalta: dataApi,
        quantidadeAulas: quantidade,
      });

      /*
       * Assim que faltaService.ts estiver pronto:
       *
       * await cadastrarFalta({
       *   idDisciplina,
       *   dataFalta: dataApi,
       *   quantidadeAulas: quantidade,
       * });
       */

      setShowSuccess(true);
    } catch (erro) {
      showAlert(
        "Erro",
        erro instanceof Error
          ? erro.message
          : "Não foi possível registrar a falta."
      );
    } finally {
      setSalvando(false);
    }
  };

  const disciplinaSelecionada = disciplinas.find(
    (disciplina) => disciplina.idDisciplina === idDisciplina
  );

  if (showSuccess) {
    return (
      <View style={styles.container}>
        <MobileHeader
          title="Registrar Falta"
          showBack
          onBack={() => navigation.goBack()}
        />

        <View style={styles.successContainer}>
          <View style={styles.iconCircle}>
            <CheckCircle2 size={64} color="#16A34A" />
          </View>

          <Text style={styles.successTitle}>
            Falta registrada com sucesso!
          </Text>

          <Text style={styles.successSubtitle}>
            A falta foi registrada em{" "}
            {disciplinaSelecionada?.nome ?? "disciplina selecionada"}.
          </Text>

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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <MobileHeader
        title="Registrar Falta"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.formCard}>
          <Text style={styles.sectionLabel}>Disciplina</Text>

          {carregando ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>
                Carregando disciplinas...
              </Text>
            </View>
          ) : disciplinas.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhuma disciplina cadastrada.
            </Text>
          ) : (
            <>
              <Pressable
                style={styles.selectButton}
                onPress={() =>
                  setMostrarDisciplinas(!mostrarDisciplinas)
                }
              >
                <View style={styles.selectContent}>
                  <BookOpen size={20} color="#64748B" />

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
                  <ChevronUp size={20} color="#64748B" />
                ) : (
                  <ChevronDown size={20} color="#64748B" />
                )}
              </Pressable>

              {mostrarDisciplinas && (
                <View style={styles.optionsContainer}>
                  {disciplinas.map((disciplina) => (
                    <Pressable
                      key={disciplina.idDisciplina}
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

                        setMostrarDisciplinas(false);
                      }}
                    >
                      <Text style={styles.disciplinaNome}>
                        {disciplina.nome}
                      </Text>

                      {disciplina.professor && (
                        <Text style={styles.disciplinaProfessor}>
                          {disciplina.professor}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={styles.fieldSpacing}>
            <Input
              label="Data da Falta"
              placeholder="DD/MM/AAAA"
              value={dataFalta}
              onChangeText={setDataFalta}
            />
          </View>

          <View style={styles.fieldSpacing}>
            <Input
              label="Quantidade de aulas perdidas"
              placeholder="Ex: 2"
              value={quantidadeAulas}
              onChangeText={setQuantidadeAulas}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.helpText}>
            Informe quantas aulas foram perdidas nessa data.
          </Text>

          <Button
            title={salvando ? "Registrando..." : "Registrar Falta"}
            onPress={handleSubmit}
            disabled={
              salvando ||
              carregando ||
              disciplinas.length === 0
            }
            style={styles.submitButton}
          />
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
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
  },

  disciplinaOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  disciplinaOptionSelected: {
    backgroundColor: "#EFF6FF",
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