import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";

import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import type {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import type {
  RouteProp,
} from "@react-navigation/native";

import type {
  RootStackParamList,
} from "../types";

import {
  buscarHorarioAulaPorId,
  atualizarHorarioAula,
} from "../services/horarioAulaService";

import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export const EditClassScheduleScreen: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList>
    >();

  const route =
    useRoute<
      RouteProp<
        RootStackParamList,
        "EditClassSchedule"
      >
    >();

  const {
    idHorario,
    idDisciplina,
    nomeDisciplina,
  } = route.params;

  const [diaSemana, setDiaSemana] =
    useState("");

  const [horaInicio, setHoraInicio] =
    useState("");

  const [horaFim, setHoraFim] =
    useState("");

  const [local, setLocal] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

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

  const horaValida = (
    hora: string
  ) => {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(
      hora.trim()
    );
  };

  useEffect(() => {
    let ativo = true;

    const carregarHorario = async () => {
      try {
        setCarregando(true);

        const horario =
          await buscarHorarioAulaPorId(
            idHorario
          );

        if (!ativo) {
          return;
        }

        setDiaSemana(
          horario.diaSemana
        );

        setHoraInicio(
          horario.horaInicio
        );

        setHoraFim(
          horario.horaFim
        );

        setLocal(
          horario.local ?? ""
        );
      } catch (error) {
        if (ativo) {
          showAlert(
            "Erro",
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o horário de aula."
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    };

    void carregarHorario();

    return () => {
      ativo = false;
    };
  }, [idHorario]);

  const handleSubmit = async () => {
    const diaTratado =
      diaSemana.trim();

    const inicioTratado =
      horaInicio.trim();

    const fimTratado =
      horaFim.trim();

    const localTratado =
      local.trim();

    if (!diaTratado) {
      showAlert(
        "Atenção",
        "Informe o dia da semana."
      );

      return;
    }

    if (diaTratado.length > 20) {
      showAlert(
        "Atenção",
        "O dia da semana deve ter até 20 caracteres."
      );

      return;
    }

    if (!horaValida(inicioTratado)) {
      showAlert(
        "Atenção",
        "Informe o horário de início no formato HH:mm."
      );

      return;
    }

    if (!horaValida(fimTratado)) {
      showAlert(
        "Atenção",
        "Informe o horário de fim no formato HH:mm."
      );

      return;
    }

    if (localTratado.length > 100) {
      showAlert(
        "Atenção",
        "O local deve ter até 100 caracteres."
      );

      return;
    }

    try {
      setSalvando(true);

      await atualizarHorarioAula(
        idHorario,
        {
          idDisciplina,
          diaSemana: diaTratado,
          horaInicio: inicioTratado,
          horaFim: fimTratado,
          local:
            localTratado || null,
        }
      );

      showAlert(
        "Sucesso",
        "Horário de aula atualizado com sucesso."
      );

      navigation.goBack();
    } catch (error) {
      showAlert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o horário de aula."
      );
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <View style={styles.container}>
        <MobileHeader
          title="Editar horário"
          showBack
          onBack={() =>
            navigation.goBack()
          }
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text style={styles.loadingText}>
            Carregando horário...
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
        title="Editar horário"
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
          <Text style={styles.title}>
            Horário de aula
          </Text>

          <Text style={styles.subtitle}>
            {nomeDisciplina}
          </Text>

          <View style={styles.fieldSpacing}>
            <Input
              label="Dia da semana"
              placeholder="Ex: Segunda-feira"
              value={diaSemana}
              onChangeText={setDiaSemana}
            />
          </View>

          <View style={styles.fieldSpacing}>
            <Input
              label="Horário de início"
              placeholder="Ex: 19:00"
              value={horaInicio}
              onChangeText={setHoraInicio}
            />
          </View>

          <View style={styles.fieldSpacing}>
            <Input
              label="Horário de fim"
              placeholder="Ex: 20:40"
              value={horaFim}
              onChangeText={setHoraFim}
            />
          </View>

          <View style={styles.fieldSpacing}>
            <Input
              label="Local"
              placeholder="Ex: Sala 12"
              value={local}
              onChangeText={setLocal}
            />
          </View>

          <Text style={styles.helpText}>
            O local é opcional. Os horários devem ser informados no formato HH:mm.
          </Text>

          <Button
            title={
              salvando
                ? "Salvando..."
                : "Salvar alterações"
            }
            onPress={handleSubmit}
            disabled={salvando}
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

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 8,
  },

  fieldSpacing: {
    marginTop: 18,
  },

  helpText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 10,
  },

  submitButton: {
    marginTop: 22,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#64748B",
  },
});