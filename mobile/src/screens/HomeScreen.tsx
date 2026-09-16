import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, UsuarioResponse } from "../types";
import { obterUsuarioSessao } from "../services/authService";
import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { ChevronRight, Plus, Clock } from "lucide-react-native";

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioResponse | null>(null);

  useEffect(() => {
    const carregarUsuario = async () => {
      const usuario = await obterUsuarioSessao();
      setUsuarioLogado(usuario);
    };
    carregarUsuario();
  }, []);

  return (
    <View style={styles.container}>
      <MobileHeader title="StudyMate" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Card Boas-vindas */}
        <Card style={styles.welcomeCard}>
          <View style={styles.welcomeRow}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>🎓</Text>
            </View>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeTitle}>
                Bem-vindo de volta, {usuarioLogado?.nome || "estudante"}!
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Seu progresso acadêmico centralizado.
              </Text>
            </View>
          </View>
        </Card>

        {/* Card Resumo Rápido */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoCardText}>
            O resumo acadêmico será exibido após sincronização completa com o backend.
          </Text>
        </Card>

        {/* Card Sequência de Estudos */}
        <Card style={styles.streakCard}>
          <View style={styles.streakRow}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View style={styles.streakTextContainer}>
              <Text style={styles.streakTitle}>Sequência de estudos</Text>
              <Text style={styles.streakSubtitle}>
                Sua sequência de estudos será exibida após o registro de atividades.
              </Text>
            </View>
          </View>
        </Card>

        {/* Próximas Entregas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximas Entregas</Text>
          <Pressable
            onPress={() => (navigation as any).navigate("CalendarTab")}
            style={styles.seeAllButton}
          >
            <Text style={styles.seeAllText}>Ver todas</Text>
            <ChevronRight size={16} color="#2563EB" />
          </Pressable>
        </View>

        <Card style={styles.infoCard}>
          <Text style={styles.infoCardText}>
            Nenhuma entrega próxima cadastrada.
          </Text>
        </Card>
      </ScrollView>

      {/* Botão Flutuante (FAB) */}
      <Pressable
        onPress={() => navigation.navigate("NewTask")}
        style={styles.fab}
      >
        <Plus size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  welcomeCard: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    marginBottom: 16,
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: "#3B82F6",
    marginTop: 2,
  },
  infoCard: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  infoCardText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  streakCard: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FFEDD5",
    marginBottom: 20,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  streakTextContainer: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9A3412",
  },
  streakSubtitle: {
    fontSize: 13,
    color: "#C2410C",
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
    marginRight: 2,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});
