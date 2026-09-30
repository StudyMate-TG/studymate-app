import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import {
  ArrowLeft,
  Save,
  GraduationCap,
} from "lucide-react-native";

import { RootStackScreenProps } from "../types";

type Props = RootStackScreenProps<"NewEvaluation">;

export const NewEvaluationScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { idDisciplina, nomeDisciplina } = route.params;

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("PROVA");
  const [dataAvaliacao, setDataAvaliacao] = useState("");
  const [peso, setPeso] = useState("");
  const [nota, setNota] = useState("");

  const tipos = ["PROVA", "TRABALHO", "SEMINARIO", "OUTRO"];

  const validarData = (data: string) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;

    if (!regex.test(data)) {
      return false;
    }

    const [dia, mes, ano] = data
      .split("/")
      .map(Number);

    const dataObj = new Date(ano, mes - 1, dia);

    return (
      dataObj.getFullYear() === ano &&
      dataObj.getMonth() === mes - 1 &&
      dataObj.getDate() === dia
    );
  };

  const salvarAvaliacao = () => {
    if (!nome.trim()) {
      Alert.alert(
        "Atenção",
        "Informe o nome da avaliação."
      );
      return;
    }

    if (!dataAvaliacao.trim()) {
      Alert.alert(
        "Atenção",
        "Informe a data da avaliação."
      );
      return;
    }

    if (!validarData(dataAvaliacao)) {
      Alert.alert(
        "Atenção",
        "Informe uma data válida no formato DD/MM/AAAA."
      );
      return;
    }

    const pesoNumero = Number(
      peso.replace(",", ".")
    );

    if (
      !peso.trim() ||
      Number.isNaN(pesoNumero) ||
      pesoNumero <= 0
    ) {
      Alert.alert(
        "Atenção",
        "Informe um peso maior que zero."
      );
      return;
    }

    if (nota.trim()) {
      const notaNumero = Number(
        nota.replace(",", ".")
      );

      if (
        Number.isNaN(notaNumero) ||
        notaNumero < 0 ||
        notaNumero > 10
      ) {
        Alert.alert(
          "Atenção",
          "A nota deve estar entre 0 e 10."
        );
        return;
      }
    }

    /*
      Ainda vamos substituir esta parte pela chamada:

      await cadastrarAvaliacao(...)

      quando criarmos o avaliacaoService.ts.
    */

    Alert.alert(
      "Dados válidos",
      "A tela está pronta. O próximo passo é integrar com o backend."
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft
              size={24}
              color="#0F172A"
            />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Nova Avaliação
            </Text>

            <Text style={styles.subjectName}>
              {nomeDisciplina}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.subjectCard}>
            <View style={styles.subjectIcon}>
              <GraduationCap
                size={24}
                color="#2563EB"
              />
            </View>

            <View style={styles.subjectInfo}>
              <Text style={styles.subjectLabel}>
                Disciplina
              </Text>

              <Text style={styles.subjectValue}>
                {nomeDisciplina}
              </Text>

              <Text style={styles.subjectId}>
                ID: {idDisciplina}
              </Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Nome da avaliação *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex.: Prova P1"
              placeholderTextColor="#94A3B8"
              value={nome}
              onChangeText={setNome}
              maxLength={100}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Tipo *
            </Text>

            <View style={styles.typesContainer}>
              {tipos.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.typeButton,
                    tipo === item &&
                      styles.typeButtonSelected,
                  ]}
                  onPress={() => setTipo(item)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      tipo === item &&
                        styles.typeButtonTextSelected,
                    ]}
                  >
                    {item === "SEMINARIO"
                      ? "SEMINÁRIO"
                      : item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Data da avaliação *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#94A3B8"
              value={dataAvaliacao}
              onChangeText={setDataAvaliacao}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>
                Peso *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ex.: 2"
                placeholderTextColor="#94A3B8"
                value={peso}
                onChangeText={setPeso}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>
                Nota
              </Text>

              <TextInput
                style={styles.input}
                placeholder="0 a 10"
                placeholderTextColor="#94A3B8"
                value={nota}
                onChangeText={setNota}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <Text style={styles.helperText}>
            A nota é opcional. Você pode cadastrá-la
            depois que receber o resultado da avaliação.
          </Text>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={salvarAvaliacao}
          >
            <Save
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.saveButtonText}>
              Salvar Avaliação
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>
              Cancelar
            </Text>
          </TouchableOpacity>
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
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    marginRight: 14,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },

  subjectName: {
    marginTop: 2,
    fontSize: 14,
    color: "#64748B",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  subjectCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 24,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE",
  },

  subjectInfo: {
    flex: 1,
    marginLeft: 14,
  },

  subjectLabel: {
    fontSize: 12,
    color: "#64748B",
  },

  subjectValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  subjectId: {
    marginTop: 2,
    fontSize: 11,
    color: "#94A3B8",
  },

  formGroup: {
    marginBottom: 20,
  },

  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },

  input: {
    height: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    color: "#0F172A",
  },

  typesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  typeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },

  typeButtonSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  typeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },

  typeButtonTextSelected: {
    color: "#FFFFFF",
  },

  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 6,
  },

  halfField: {
    flex: 1,
  },

  helperText: {
    marginTop: 4,
    marginBottom: 28,
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
  },

  saveButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#2563EB",
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  cancelButton: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
  },
});