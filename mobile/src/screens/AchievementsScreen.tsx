import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { Trophy, TrendingUp } from "lucide-react-native";

export const AchievementsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <MobileHeader title="Conquistas" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Card Nível */}
        <Card style={styles.levelCard}>
          <View style={styles.levelContent}>
            <View style={styles.trophyCircle}>
              <Trophy size={32} color="#2563EB" />
            </View>
            <Text style={styles.levelTitle}>Progresso do estudante</Text>
            <Text style={styles.levelSubtitle}>
              Nível e XP serão exibidos após a integração completa com o backend.
            </Text>
          </View>
        </Card>

        {/* Card Sequência */}
        <Card style={styles.streakCard}>
          <View style={styles.streakRow}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakTitle}>Sequência de estudos</Text>
              <Text style={styles.streakSubtitle}>
                Sua sequência será exibida após o registro contínuo de presenças e entregas.
              </Text>
            </View>
          </View>
        </Card>

        {/* Resumo de Badges */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Badges conquistados</Text>
        </View>

        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nenhuma conquista cadastrada</Text>
          <Text style={styles.emptySubtitle}>
            As conquistas serão desbloqueadas conforme o estudante avança no sistema.
          </Text>
        </Card>

        {/* Indicadores de Progresso */}
        <Card style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <TrendingUp size={20} color="#2563EB" />
            <Text style={styles.insightTitle}>Seu progresso</Text>
          </View>
          <Text style={styles.insightText}>
            Indicadores de evolução acadêmica serão gerados dinamicamente com base nas suas notas e presenças.
          </Text>
        </Card>
      </ScrollView>
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
  levelCard: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    marginBottom: 16,
    padding: 24,
  },
  levelContent: {
    alignItems: "center",
    textAlign: "center",
  },
  trophyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  levelSubtitle: {
    fontSize: 13,
    color: "#3B82F6",
    textAlign: "center",
  },
  streakCard: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FFEDD5",
    marginBottom: 20,
    padding: 16,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  streakInfo: {
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyCard: {
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
  insightCard: {
    padding: 16,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  insightText: {
    fontSize: 13,
    color: "#64748B",
  },
});
