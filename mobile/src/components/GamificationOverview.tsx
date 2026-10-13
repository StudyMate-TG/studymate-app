import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Check, Flame, Sparkles, Trophy } from "lucide-react-native";
import { Card } from "./Card";
import type { GamificacaoResponse } from "../services/gamificacaoService";

export const ProgressBar = ({ value, total, color = "#2563EB" }: { value: number; total: number; color?: string }) => (
  <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: Math.min(value, total) }}>
    <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, total > 0 ? value / total * 100 : 0))}%`, backgroundColor: color }]} />
  </View>
);

export const GamificationOverview = ({ progresso, onConquistas }: { progresso: GamificacaoResponse; onConquistas?: () => void }) => {
  const metaAtingida = progresso.xpHoje >= progresso.metaDiaria;
  const conquistadas = progresso.medalhas.filter((medalha) => medalha.desbloqueada).length;
  return (
    <>
      <Card style={styles.levelCard}>
        <View style={styles.row}>
          <View style={styles.levelIcon}><Sparkles size={26} color="#2563EB" /></View>
          <View style={styles.flex}>
            <Text style={styles.overline}>SEU PROGRESSO</Text>
            <Text style={styles.levelTitle}>Nível {progresso.nivel}</Text>
          </View>
          <View><Text style={styles.total}>{progresso.xpTotal}</Text><Text style={styles.totalCaption}>XP total</Text></View>
        </View>
        <ProgressBar value={progresso.xpNoNivel} total={progresso.xpNoNivel + progresso.xpParaProximoNivel} />
        <Text style={styles.caption}>Faltam {progresso.xpParaProximoNivel} XP para o nível {progresso.nivel + 1}</Text>
        <View style={styles.goalRow}>
          <View style={styles.goalLabel}><Check size={16} color={metaAtingida ? "#16A34A" : "#64748B"} /><Text style={styles.goalText}>{metaAtingida ? "Meta diária concluída!" : "Sua meta de hoje"}</Text></View>
          <Text style={styles.goalNumber}>{progresso.xpHoje}/{progresso.metaDiaria} XP</Text>
        </View>
        <ProgressBar value={progresso.xpHoje} total={progresso.metaDiaria} color="#22C55E" />
      </Card>
      <Card style={styles.streakCard}>
        <View style={styles.row}>
          <View style={styles.fire}><Flame size={34} color="#F97316" fill="#FDBA74" /></View>
          <View style={styles.flex}>
            <Text style={styles.streakTitle}>{progresso.ofensivaAtual} {progresso.ofensivaAtual === 1 ? "dia de ofensiva" : "dias de ofensiva"}</Text>
            <Text style={styles.streakCopy}>{progresso.ativoHoje ? "Você manteve sua chama acesa hoje!" : progresso.ofensivaAtual > 0 ? "Conclua uma tarefa ou registre presença hoje para manter sua chama." : "Comece hoje: uma tarefa ou uma presença acende sua chama."}</Text>
          </View>
        </View>
        <View style={styles.week}>
          {progresso.semana.map((dia, index) => (
            <View key={dia.data} style={styles.day}>
              <Text style={styles.dayLabel}>{new Date(`${dia.data}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }).replace(".", "").slice(0, 3)}</Text>
              <View style={[styles.dayCircle, dia.ativo && styles.dayActive, index === progresso.semana.length - 1 && styles.dayToday]} accessibilityLabel={`${dia.data}: ${dia.ativo ? "atividade registrada" : "sem atividade"}`}>
                {dia.ativo ? <Check size={17} color="#FFFFFF" strokeWidth={3} /> : <Text style={styles.dayNumber}>{dia.data.slice(8)}</Text>}
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.record}>Melhor ofensiva: {progresso.melhorOfensiva} {progresso.melhorOfensiva === 1 ? "dia" : "dias"}</Text>
      </Card>
      {onConquistas && <Pressable onPress={onConquistas} style={styles.badgesLink} accessibilityRole="button">
        <Trophy size={18} color="#CA8A04" /><Text style={styles.badgesText}>{conquistadas} de {progresso.medalhas.length} medalhas conquistadas</Text><Text style={styles.badgesAction}>Ver →</Text>
      </Pressable>}
    </>
  );
};

const styles = StyleSheet.create({
  levelCard: { marginBottom: 14, backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", padding: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1 },
  levelIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 1.3, color: "#64748B" },
  levelTitle: { fontSize: 23, fontWeight: "800", color: "#1E3A8A", marginTop: 2 },
  total: { fontSize: 23, fontWeight: "800", color: "#2563EB", textAlign: "right" },
  totalCaption: { fontSize: 11, color: "#64748B", textAlign: "right" },
  progressTrack: { height: 8, backgroundColor: "#E2E8F0", borderRadius: 10, overflow: "hidden", marginTop: 12 },
  progressFill: { height: "100%", borderRadius: 10 },
  caption: { color: "#64748B", fontSize: 12, marginTop: 7 },
  goalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 18, gap: 8 },
  goalLabel: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  goalText: { fontSize: 12, fontWeight: "600", color: "#334155" },
  goalNumber: { fontSize: 12, fontWeight: "700", color: "#15803D" },
  streakCard: { marginBottom: 12, backgroundColor: "#FFF7ED", borderColor: "#FED7AA", padding: 18 },
  fire: { width: 46, alignItems: "center" },
  streakTitle: { fontSize: 19, fontWeight: "800", color: "#9A3412" },
  streakCopy: { fontSize: 12, color: "#C2410C", marginTop: 4, lineHeight: 18 },
  week: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  day: { alignItems: "center", flex: 1 },
  dayLabel: { fontSize: 10, color: "#9A3412", marginBottom: 6, textTransform: "uppercase" },
  dayCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FFEDD5", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  dayActive: { backgroundColor: "#F97316" },
  dayToday: { borderColor: "#C2410C" },
  dayNumber: { fontSize: 11, color: "#C2410C", fontWeight: "600" },
  record: { fontSize: 11, color: "#9A3412", textAlign: "center", marginTop: 12 },
  badgesLink: { backgroundColor: "#FEFCE8", borderColor: "#FEF08A", borderWidth: 1, borderRadius: 12, padding: 13, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 22 },
  badgesText: { flex: 1, color: "#854D0E", fontSize: 12, fontWeight: "600" },
  badgesAction: { color: "#854D0E", fontSize: 12, fontWeight: "700" },
});
