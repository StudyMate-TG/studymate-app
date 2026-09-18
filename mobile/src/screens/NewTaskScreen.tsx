import React, { useState } from "react";

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

import { RootStackParamList } from "../types";

import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

import { CheckCircle2 } from "lucide-react-native";

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

export const NewTaskScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    dueDate: "",
    priority: "medium" as Priority,
    description: "",
  });

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const isValidDateTime = (value: string) => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/;
    const match = value.match(regex);

    if (!match) {
      return false;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const hour = match[4] ? Number(match[4]) : 0;
    const minute = match[5] ? Number(match[5]) : 0;

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

    const date = new Date(year, month - 1, day, hour, minute);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      date.getHours() === hour &&
      date.getMinutes() === minute
    );
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      showAlert("Atenção", "Informe o título da tarefa.");
      return;
    }

    if (form.dueDate.trim() && !isValidDateTime(form.dueDate.trim())) {
      showAlert(
        "Atenção",
        "Informe a data no formato DD/MM/AAAA ou DD/MM/AAAA HH:mm."
      );
      return;
    }

    setShowSuccess(true);
  };

  if (showSuccess) {
    return (
      <View style={styles.container}>
        <MobileHeader
          title="Nova Tarefa"
          showBack
          onBack={() => navigation.goBack()}
        />

        <View style={styles.successContainer}>
          <View style={styles.iconCircle}>
            <CheckCircle2 size={64} color="#16A34A" />
          </View>

          <Text style={styles.successTitle}>
            Tarefa registrada com sucesso!
          </Text>

          <Text style={styles.successSubtitle}>
            A tarefa foi registrada no protótipo acadêmico.
          </Text>

          <Button
            title="Voltar"
            onPress={() => navigation.goBack()}
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
        title="Nova Tarefa"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.formCard}>
          <Input
            label="Título da Tarefa"
            placeholder="Ex: Entrega do trabalho"
            value={form.title}
            onChangeText={(text) => setForm({ ...form, title: text })}
          />

          <Input
            label="Disciplina"
            placeholder="Ex: Banco de Dados"
            value={form.subject}
            onChangeText={(text) => setForm({ ...form, subject: text })}
          />

          <Input
            label="Data e Hora de Entrega"
            placeholder="Ex: 25/11/2026 23:59"
            value={form.dueDate}
            onChangeText={(text) => setForm({ ...form, dueDate: text })}
          />

          <Text style={styles.sectionLabel}>Prioridade</Text>

          <View style={styles.priorityRow}>
            {(["low", "medium", "high"] as const).map((priority) => {
              const isSelected = form.priority === priority;

              return (
                <Pressable
                  key={priority}
                  onPress={() => setForm({ ...form, priority })}
                  style={[
                    styles.priorityButton,
                    isSelected && {
                      borderColor: priorityColors[priority],
                      backgroundColor: "#F8FAFC",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: priorityColors[priority] },
                    ]}
                  />

                  <Text
                    style={[
                      styles.priorityText,
                      isSelected && styles.priorityTextSelected,
                    ]}
                  >
                    {priorityLabels[priority]}
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
            onChangeText={(text) => setForm({ ...form, description: text })}
            style={styles.textArea}
          />

          <View style={styles.actionButtons}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            />

            <Button
              title="Cadastrar"
              onPress={handleSubmit}
              style={styles.submitButton}
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