import React, { useCallback, useState } from "react";

import {
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";

import { useFocusEffect, useNavigation } from "@react-navigation/native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  PeriodoLetivoResponse,
  RootStackParamList,
} from "../types";

import { cadastrarDisciplina } from "../services/disciplinaService";

import { obterUsuarioSessao } from "../services/authService";

import { listarPeriodosLetivos } from "../services/periodoLetivoService";

import { MobileHeader } from "../components/MobileHeader";

import { Card } from "../components/Card";

import { Input } from "../components/Input";

import { Button } from "../components/Button";

import {
  CalendarDays,
  CheckCircle2,
  Plus,
  Save,
} from "lucide-react-native";

export const NewSubjectScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [idUsuario, setIdUsuario] = useState<number | null>(null);
  const [periodos, setPeriodos] = useState<PeriodoLetivoResponse[]>([]);
  const [idPeriodoSelecionado, setIdPeriodoSelecionado] = useState<
    number | null
  >(null);

  const [isLoadingPeriodos, setIsLoadingPeriodos] = useState(true);
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

  const carregarPeriodos = useCallback(async () => {
    try {
      setIsLoadingPeriodos(true);

      const usuario = await obterUsuarioSessao();

      if (!usuario?.idUsuario) {
        showAlert("Erro", "Usuário não encontrado. Faça login novamente.");
        navigation.replace("Login");
        return;
      }

      setIdUsuario(usuario.idUsuario);

      const dados = await listarPeriodosLetivos(usuario.idUsuario);

      setPeriodos(dados);

      if (dados.length > 0) {
        const periodoAtivo = dados.find(
          (periodo) => periodo.status === "ATIVO"
        );

        setIdPeriodoSelecionado(
          periodoAtivo?.idPeriodo ?? dados[0].idPeriodo
        );
      } else {
        setIdPeriodoSelecionado(null);
      }
    } catch (error) {
      showAlert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Erro ao carregar períodos letivos."
      );
    } finally {
      setIsLoadingPeriodos(false);
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

  const handleSubmit = async () => {
    if (isLoading) {
      return;
    }

    if (!idUsuario) {
      showAlert("Erro", "Usuário não encontrado. Faça login novamente.");
      return;
    }

    if (!idPeriodoSelecionado) {
      showAlert(
        "Atenção",
        "Selecione um período letivo antes de cadastrar a disciplina."
      );
      return;
    }

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

    try {
      setIsLoading(true);

      await cadastrarDisciplina({
        idUsuario,
        idPeriodo: idPeriodoSelecionado,
        nome: form.nome.trim(),
        professor: form.professor.trim(),
        mediaAprovacao,
        limiteFaltas,
      });

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

  const renderPeriodo = (periodo: PeriodoLetivoResponse) => {
    const isSelecionado = periodo.idPeriodo === idPeriodoSelecionado;
    const isAtivo = periodo.status === "ATIVO";

    return (
      <Pressable
        key={periodo.idPeriodo}
        onPress={() => setIdPeriodoSelecionado(periodo.idPeriodo)}
        style={[
          styles.periodCard,
          isSelecionado && styles.periodCardSelected,
        ]}
      >
        <View style={styles.periodIconContainer}>
          <CalendarDays
            size={20}
            color={isSelecionado ? "#2563EB" : "#64748B"}
          />
        </View>

        <View style={styles.periodTextContainer}>
          <View style={styles.periodTitleRow}>
            <Text style={styles.periodName}>{periodo.nome}</Text>

            {isSelecionado ? (
              <CheckCircle2 size={18} color="#2563EB" />
            ) : null}
          </View>

          <Text style={styles.periodDates}>
            {formatarData(periodo.dataInicio)} até{" "}
            {formatarData(periodo.dataFim)}
          </Text>

          <Text
            style={[
              styles.periodStatus,
              isAtivo ? styles.periodStatusActive : styles.periodStatusInactive,
            ]}
          >
            {periodo.status}
          </Text>
        </View>
      </Pressable>
    );
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
          <Text style={styles.sectionTitle}>Período letivo</Text>

          {isLoadingPeriodos ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.loadingText}>Carregando períodos...</Text>
            </View>
          ) : periodos.length > 0 ? (
            <View style={styles.periodList}>
              {periodos.map(renderPeriodo)}
            </View>
          ) : (
            <View style={styles.emptyPeriodContainer}>
              <Text style={styles.emptyPeriodTitle}>
                Nenhum período letivo cadastrado
              </Text>

              <Text style={styles.emptyPeriodText}>
                Cadastre um período letivo antes de adicionar disciplinas.
              </Text>

              <Button
                title="Criar período letivo"
                icon={<Plus size={18} color="#FFFFFF" />}
                onPress={() => navigation.navigate("NewPeriod")}
                style={styles.createPeriodButton}
              />
            </View>
          )}

          <View style={styles.divider} />

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
            disabled={isLoading || isLoadingPeriodos || !idPeriodoSelecionado}
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

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  loadingText: {
    marginLeft: 10,
    fontSize: 13,
    color: "#64748B",
  },

  periodList: {
    gap: 10,
  },

  periodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },

  periodCardSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },

  periodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    marginRight: 12,
  },

  periodTextContainer: {
    flex: 1,
  },

  periodTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  periodName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginRight: 8,
  },

  periodDates: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
  },

  periodStatus: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
  },

  periodStatusActive: {
    color: "#16A34A",
  },

  periodStatusInactive: {
    color: "#64748B",
  },

  emptyPeriodContainer: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },

  emptyPeriodTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },

  emptyPeriodText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },

  createPeriodButton: {
    marginTop: 12,
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 18,
  },

  submitButton: {
    marginTop: 8,
  },
});