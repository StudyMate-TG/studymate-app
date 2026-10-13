import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Award, BookOpen, CheckCircle2, Flame, Gem, LockKeyhole, Rocket, Sparkles, Star, Trophy, Zap } from "lucide-react-native";
import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { GamificationOverview, ProgressBar } from "../components/GamificationOverview";
import { useGamificacao } from "../hooks/useGamificacao";

const medalhaIcons = {
  "checkmark-circle": CheckCircle2, rocket: Rocket, trophy: Trophy, school: BookOpen,
  ribbon: Award, flame: Flame, diamond: Gem, flash: Zap, star: Star,
};

const formatarDia = (data: string) => {
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : data;
};

export const AchievementsScreen: React.FC = () => {
  const { progresso, carregando, erro, xpConfirmado, atualizar } = useGamificacao();
  const conquistadas = progresso?.medalhas.filter((medalha) => medalha.desbloqueada).length ?? 0;

  return (
    <View style={styles.container}>
      <MobileHeader title="Conquistas" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text style={styles.title}>Sua jornada, suas conquistas</Text>
          <Text style={styles.subtitle}>Um pouco a cada dia leva você mais longe.</Text>
        </View>
        {xpConfirmado > 0 && <View style={styles.reward} accessibilityLiveRegion="polite"><Text style={styles.rewardText}>✨ +{xpConfirmado} XP confirmados!</Text></View>}
        {progresso && <GamificationOverview progresso={progresso} />}
        {!progresso && <Card style={styles.emptyCard}><Trophy size={32} color="#2563EB" /><Text style={styles.emptyTitle}>{carregando ? "Carregando suas conquistas..." : "Conecte-se para atualizar seu progresso"}</Text><Text style={styles.subtitle}>Seus pontos e medalhas ficam salvos na sua conta.</Text></Card>}
        {erro ? <Card style={styles.errorCard}><Text style={styles.subtitle}>Não foi possível atualizar seu progresso. {erro}</Text><Button title="Tentar novamente" variant="ghost" onPress={() => { void atualizar(); }} /></Card> : null}

        {progresso && <>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Sua coleção</Text><Text style={styles.collectionCount}>{conquistadas}/{progresso.medalhas.length} desbloqueadas</Text></View>
          <View style={styles.badgeGrid}>
            {progresso.medalhas.map((medalha) => {
              const Icon = medalhaIcons[medalha.icone as keyof typeof medalhaIcons] ?? Award;
              return <Card key={medalha.codigo} style={[styles.badgeCard, medalha.desbloqueada && styles.badgeCardUnlocked]}>
                <View style={[styles.badgeIcon, medalha.desbloqueada && styles.badgeIconUnlocked]}><Icon size={30} color={medalha.desbloqueada ? "#CA8A04" : "#94A3B8"} /></View>
                <Text style={styles.badgeName}>{medalha.nome}</Text>
                <Text style={styles.badgeDescription}>{medalha.descricao}</Text>
                <View style={styles.badgeFooter}>
                  {medalha.desbloqueada ? <><View style={styles.badgeState}><CheckCircle2 size={13} color="#16A34A" /><Text style={styles.unlockedText}>Conquistada</Text></View>{medalha.desbloqueadaEm && <Text style={styles.unlockedDate}>{formatarDia(medalha.desbloqueadaEm)}</Text>}</> : <><View style={styles.badgeState}><LockKeyhole size={12} color="#64748B" /><Text style={styles.lockedText}>{Math.min(medalha.progresso, medalha.meta)}/{medalha.meta}</Text></View><ProgressBar value={medalha.progresso} total={medalha.meta} color="#94A3B8" /></>}
                </View>
              </Card>;
            })}
          </View>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}><Text style={styles.statNumber}>{progresso.tarefasConcluidas}</Text><Text style={styles.statLabel}>Tarefas concluídas</Text></Card>
            <Card style={styles.statCard}><Text style={styles.statNumber}>{progresso.presencasRegistradas}</Text><Text style={styles.statLabel}>Presenças</Text></Card>
            <Card style={styles.statCard}><Text style={styles.statNumber}>{progresso.diasAtivos}</Text><Text style={styles.statLabel}>Dias ativos</Text></Card>
          </View>

          <Text style={styles.sectionTitle}>Atividades recentes</Text>
          <Card style={styles.activityCard}>
            {progresso.atividadesRecentes.length === 0 ? <Text style={styles.subtitle}>Conclua sua primeira tarefa ou registre uma presença para começar a ganhar XP.</Text> : progresso.atividadesRecentes.map((atividade) => <View key={atividade.id} style={styles.activityRow}>
              <View style={styles.activityIcon}>{atividade.tipo === "PRESENCA" ? <BookOpen size={18} color="#2563EB" /> : <CheckCircle2 size={18} color="#16A34A" />}</View>
              <View style={styles.activityContent}><Text style={styles.activityDescription}>{atividade.descricao}</Text><Text style={styles.activityDate}>{formatarDia(atividade.dataAtividade)}</Text></View>
              <Text style={styles.activityXp}>+{atividade.xp} XP</Text>
            </View>)}
          </Card>
        </>}

        <Card style={styles.howCard}>
          <View style={styles.howTitle}><Sparkles size={18} color="#2563EB" /><Text style={styles.howTitleText}>Como avançar</Text></View>
          <Text style={styles.howCopy}>Primeira conclusão de uma tarefa: +30 XP. Presença na aula de hoje: +20 XP por disciplina. A cada 100 XP, um novo nível!</Text>
          <Text style={styles.howCopy}>Sua atividade de hoje mantém a ofensiva, no horário de Brasília. No modo offline, o XP e a ofensiva contam no dia da confirmação pelo servidor.</Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 16, paddingBottom: 90, maxWidth: 600, width: "100%", alignSelf: "center" },
  heading: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginBottom: 5 },
  subtitle: { fontSize: 13, color: "#64748B", lineHeight: 20 },
  reward: { backgroundColor: "#DCFCE7", borderColor: "#86EFAC", borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14 },
  rewardText: { color: "#166534", fontWeight: "700", textAlign: "center" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 14, gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  collectionCount: { fontSize: 11, color: "#64748B" },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  badgeCard: { width: "47.8%", flexGrow: 1, alignItems: "center", padding: 15, minHeight: 225, backgroundColor: "#FFFFFF" },
  badgeCardUnlocked: { backgroundColor: "#FFFEF5", borderColor: "#FDE68A" },
  badgeIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  badgeIconUnlocked: { backgroundColor: "#FEF3C7" },
  badgeName: { fontSize: 14, fontWeight: "700", color: "#334155", textAlign: "center", marginBottom: 5 },
  badgeDescription: { fontSize: 11, color: "#64748B", textAlign: "center", lineHeight: 17 },
  badgeFooter: { marginTop: "auto", paddingTop: 14, width: "100%" },
  badgeState: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  unlockedText: { fontSize: 11, color: "#15803D", fontWeight: "700" },
  unlockedDate: { color: "#64748B", fontSize: 10, textAlign: "center", marginTop: 5 },
  lockedText: { fontSize: 11, color: "#64748B", fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  statCard: { flex: 1, alignItems: "center", padding: 12 },
  statNumber: { fontSize: 22, color: "#2563EB", fontWeight: "800" },
  statLabel: { fontSize: 10, color: "#64748B", textAlign: "center", marginTop: 5 },
  activityCard: { marginTop: 12, marginBottom: 20 },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11 },
  activityIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  activityContent: { flex: 1 },
  activityDescription: { fontSize: 12, fontWeight: "600", color: "#334155" },
  activityDate: { fontSize: 10, color: "#94A3B8", marginTop: 3 },
  activityXp: { fontSize: 12, fontWeight: "700", color: "#16A34A" },
  emptyCard: { alignItems: "center", padding: 24, marginBottom: 16, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#334155", textAlign: "center" },
  errorCard: { marginBottom: 16 },
  howCard: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  howTitle: { flexDirection: "row", alignItems: "center", gap: 7 },
  howTitleText: { color: "#1E3A8A", fontSize: 14, fontWeight: "700" },
  howCopy: { fontSize: 12, lineHeight: 19, color: "#475569", marginTop: 8 },
});
