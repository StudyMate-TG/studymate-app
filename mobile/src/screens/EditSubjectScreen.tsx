import React, { useEffect, useState } from "react";

import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";

import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types";

import {
  buscarDisciplinaPorId,
  atualizarDisciplina,
} from "../services/disciplinaService";

import { obterUsuarioSessao } from "../services/authService";

import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

import { Save } from "lucide-react-native";

type EditSubjectRouteProp = RouteProp<RootStackParamList, "EditSubject">;

export const EditSubjectScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const route = useRoute<EditSubjectRouteProp>();

  const { idDisciplina } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

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

  const obterIdUsuarioLogado = async (): Promise<number> => {
    const usuario = await obterUsuarioSessao();

    if (!usuario?.idUsuario) {
      throw new Error("Usuário não encontrado. Faça login novamente.");
    }

    return usuario.idUsuario;
  };

  useEffect(() => {
    const carregarDisciplina = async () => {
      setIsFetching(true);

      try {
        const idUsuario = await obterIdUsuarioLogado();

        const dados = await buscarDisciplinaPorId(idDisciplina, idUsuario);

        setForm({
          nome: dados.nome,
          professor: dados.professor || "",
          mediaAprovacao: dados.mediaAprovacao.toString(),
          limiteFaltas: dados.limiteFaltas.toString(),
        });
      } catch (error) {
        showAlert(
          "Erro",
          error instanceof Error ? error.message : "Erro ao buscar disciplina."
        );

        navigation.goBack();
      } finally {
        setIsFetching(false);
      }
    };

    carregarDisciplina();
  }, [idDisciplina, navigation]);

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
      const idUsuario = await obterIdUsuarioLogado();

      await atualizarDisciplina(idDisciplina, idUsuario, {
        idUsuario,
        nome: form.nome.trim(),
        professor: form.professor.trim(),
        mediaAprovacao,
        limiteFaltas,
      });

      showAlert("Sucesso", "Disciplina atualizada com sucesso!");
      navigation.goBack();
    } catch (error) {
      showAlert(
        "Erro",
        error instanceof Error ? error.message : "Erro ao atualizar disciplina."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View style={styles.container}>
        <MobileHeader
          title="Editar Disciplina"
          showBack
          onBack={() => navigation.goBack()}
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
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
        title="Editar Disciplina"
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
            title="Salvar alterações"
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

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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