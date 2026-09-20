import React, { useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ArrowLeft, CalendarPlus } from "lucide-react-native";

import type {
  PeriodoLetivoStatus,
  RootStackScreenProps,
} from "../types";

import { obterUsuarioSessao } from "../services/authService";

import { cadastrarPeriodoLetivo } from "../services/periodoLetivoService";

type Props = RootStackScreenProps<"NewPeriod">;

type FormState = {
  nome: string;
  dataInicio: string;
  dataFim: string;
  status: PeriodoLetivoStatus;
};

const initialForm: FormState = {
  nome: "",
  dataInicio: "",
  dataFim: "",
  status: "ATIVO",
};

export const NewPeriodScreen: React.FC<Props> = ({ navigation }) => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const atualizarCampo = (campo: keyof FormState, valor: string) => {
    setForm((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }));
  };

  const selecionarStatus = (status: PeriodoLetivoStatus) => {
    setForm((estadoAtual) => ({
      ...estadoAtual,
      status,
    }));
  };

  const validarData = (data: string) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(data);
  };

  const handleSubmit = async () => {
  if (isSubmitting) {
    return;
  }

  if (!form.nome.trim()) {
    Alert.alert("Atenção", "Informe o nome do período letivo.");
    return;
  }

  if (!validarData(form.dataInicio)) {
    Alert.alert(
      "Atenção",
      "Informe a data de início no formato AAAA-MM-DD."
    );
    return;
  }

  if (!validarData(form.dataFim)) {
    Alert.alert("Atenção", "Informe a data de fim no formato AAAA-MM-DD.");
    return;
  }

  if (form.dataFim < form.dataInicio) {
    Alert.alert(
      "Atenção",
      "A data de fim não pode ser anterior à data de início."
    );
    return;
  }

  try {
    setIsSubmitting(true);

    const usuario = await obterUsuarioSessao();

    if (!usuario) {
      navigation.replace("Login");
      return;
    }

    await cadastrarPeriodoLetivo({
      idUsuario: usuario.idUsuario,
      nome: form.nome.trim(),
      dataInicio: form.dataInicio,
      dataFim: form.dataFim,
      status: form.status,
    });

    navigation.goBack();
  } catch (erro) {
    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Não foi possível cadastrar o período letivo.";

    Alert.alert("Erro", mensagem);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#0F172A" />
          </Pressable>

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Novo Período</Text>
            <Text style={styles.subtitle}>
              Cadastre o período letivo atual do aluno.
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconContainer}>
            <CalendarPlus size={36} color="#2563EB" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nome do período</Text>

            <TextInput
              value={form.nome}
              onChangeText={(valor) => atualizarCampo("nome", valor)}
              placeholder="Ex.: 2026 - 2º semestre"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Data de início</Text>

            <TextInput
              value={form.dataInicio}
              onChangeText={(valor) => atualizarCampo("dataInicio", valor)}
              placeholder="AAAA-MM-DD"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Data de fim</Text>

            <TextInput
              value={form.dataFim}
              onChangeText={(valor) => atualizarCampo("dataFim", valor)}
              placeholder="AAAA-MM-DD"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>

            <View style={styles.statusOptions}>
              <Pressable
                onPress={() => selecionarStatus("ATIVO")}
                style={[
                  styles.statusOption,
                  form.status === "ATIVO" && styles.statusOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    form.status === "ATIVO" &&
                      styles.statusOptionTextSelected,
                  ]}
                >
                  ATIVO
                </Text>
              </Pressable>

              <Pressable
                onPress={() => selecionarStatus("INATIVO")}
                style={[
                  styles.statusOption,
                  form.status === "INATIVO" && styles.statusOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    form.status === "INATIVO" &&
                      styles.statusOptionTextSelected,
                  ]}
                >
                  INATIVO
                </Text>
              </Pressable>

              <Pressable
                onPress={() => selecionarStatus("CONCLUIDO")}
                style={[
                  styles.statusOption,
                  form.status === "CONCLUIDO" && styles.statusOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    form.status === "CONCLUIDO" &&
                      styles.statusOptionTextSelected,
                  ]}
                >
                  CONCLUÍDO
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            disabled={isSubmitting}
            onPress={handleSubmit}
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Salvando..." : "Salvar período"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboardContainer: {
    flex: 1,
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
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    marginBottom: 26,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    color: "#0F172A",
  },
  statusOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statusOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  statusOptionSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#DBEAFE",
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  statusOptionTextSelected: {
    color: "#1D4ED8",
  },
  submitButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#2563EB",
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});