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

import { CheckCircle2, Check, X } from "lucide-react-native";

type AttendanceStatus = "present" | "absent" | "";

export const NewAttendanceScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [attendance, setAttendance] = useState<AttendanceStatus>("");
  const [dataAula, setDataAula] = useState(
    new Date().toLocaleDateString("pt-BR")
  );
  const [showSuccess, setShowSuccess] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

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

  const handleSubmit = () => {
    if (!dataAula.trim()) {
      showAlert("Atenção", "Informe a data da aula.");
      return;
    }

    if (!isValidBrazilianDate(dataAula.trim())) {
      showAlert("Atenção", "Informe a data no formato DD/MM/AAAA.");
      return;
    }

    if (!attendance) {
      showAlert("Atenção", "Selecione Presença ou Falta.");
      return;
    }

    setShowSuccess(true);
  };

  if (showSuccess) {
    return (
      <View style={styles.container}>
        <MobileHeader
          title="Cadastrar Frequência"
          showBack
          onBack={() => navigation.goBack()}
        />

        <View style={styles.successContainer}>
          <View style={styles.iconCircle}>
            <CheckCircle2 size={64} color="#16A34A" />
          </View>

          <Text style={styles.successTitle}>
            Frequência registrada com sucesso!
          </Text>

          <Text style={styles.successSubtitle}>
            {attendance === "present"
              ? "Presença computada no diário acadêmico."
              : "Falta computada no diário acadêmico."}
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
        title="Cadastrar Frequência"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.formCard}>
          <Input
            label="Data da Aula"
            placeholder="DD/MM/AAAA"
            value={dataAula}
            onChangeText={setDataAula}
          />

          <Text style={styles.sectionLabel}>Registro de Presença</Text>

          <Pressable
            onPress={() => setAttendance("present")}
            style={[
              styles.optionCard,
              attendance === "present" && styles.optionCardPresent,
            ]}
          >
            <View style={[styles.optionIcon, styles.optionIconPresent]}>
              <Check size={20} color="#16A34A" />
            </View>

            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Presença</Text>
              <Text style={styles.optionSubtitle}>Estive presente na aula</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setAttendance("absent")}
            style={[
              styles.optionCard,
              attendance === "absent" && styles.optionCardAbsent,
            ]}
          >
            <View style={[styles.optionIcon, styles.optionIconAbsent]}>
              <X size={20} color="#EF4444" />
            </View>

            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Falta</Text>
              <Text style={styles.optionSubtitle}>Não compareci à aula</Text>
            </View>
          </Pressable>

          <Button
            title="Registrar Frequência"
            onPress={handleSubmit}
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
    marginBottom: 10,
  },

  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },

  optionCardPresent: {
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },

  optionCardAbsent: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },

  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  optionIconPresent: {
    backgroundColor: "#DCFCE7",
  },

  optionIconAbsent: {
    backgroundColor: "#FEE2E2",
  },

  optionTextContainer: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  optionSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  submitButton: {
    marginTop: 12,
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