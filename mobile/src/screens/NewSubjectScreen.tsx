import React, { useState } from "react";

import {
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types";

import { cadastrarDisciplina } from "../services/disciplinaService";
import { obterUsuarioSessao } from "../services/authService";

import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

import { Save } from "lucide-react-native";

export const NewSubjectScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    professor: "",
    mediaAprovacao: "6",
    limiteFaltas: "20",
  });

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    if (!form.nome.trim()) {
      showAlert("Atenção", "O nome da disciplina é obrigatório.");
      return;
    }

    if (!form.professor.trim()) {
      showAlert("Atenção", "O professor da disciplina é obrigatório.");
      return;
    }

    const mediaAprovacao = Number(form.mediaAprovacao.replace(",", "."));
    const limiteFaltas = Number(form.limiteFaltas);

    if (
      Number.isNaN(mediaAprovacao) ||
      mediaAprovacao < 0 ||
      mediaAprovacao > 10
    ) {
      showAlert("Atenção", "A média de aprovação deve estar entre 0 e 10.");
      return;
    }

    if (Number.isNaN(limiteFaltas) || limiteFaltas < 0) {
      showAlert("Atenção", "O limite de faltas deve ser um número válido.");
      return;
    }

    setIsLoading(true);

    try {
      const usuario = await obterUsuarioSessao();

      if (!usuario?.idUsuario) {
        showAlert("Erro", "Usuário não encontrado. Faça login novamente.");
        return;
      }

      await cadastrarDisciplina({
        idUsuario: usuario.idUsuario,
        nome: form.nome.trim(),
        professor: form.professor.trim(),
        mediaAprovacao,
        limiteFaltas,
      });

      showAlert("Sucesso", "Disciplina cadastrada com sucesso!");
      navigation.goBack();
    } catch (error) {
      showAlert(
        "Erro",
        error instanceof Error ? error.message : "Erro ao cadastrar disciplina."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <MobileHeader
        title="Nova Disciplina"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.formCard}>
          <Input
            label="Nome da disciplina"
            placeholder="Ex: Banco de Dados"
            value={form.nome}
            onChangeText={(text) => setForm({ ...form, nome: text })}
          />

          <Input
            label="Professor"
            placeholder="Ex: Prof. Carlos"
            value={form.professor}
            onChangeText={(text) => setForm({ ...form, professor: text })}
          />

          <Input
            label="Média de aprovação"
            placeholder="Ex: 6.0"
            keyboardType="decimal-pad"
            value={form.mediaAprovacao}
            onChangeText={(text) =>
              setForm({ ...form, mediaAprovacao: text })
            }
          />

          <Input
            label="Limite de faltas"
            placeholder="Ex: 20"
            keyboardType="numeric"
            value={form.limiteFaltas}
            onChangeText={(text) => setForm({ ...form, limiteFaltas: text })}
          />

          <Button
            title="Salvar disciplina"
            icon={<Save size={18} color="#FFFFFF" />}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
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

  submitButton: {
    marginTop: 8,
  },
});