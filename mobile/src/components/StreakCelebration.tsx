import React, { useEffect, useState } from "react";
import { AccessibilityInfo, Image, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { Flame } from "lucide-react-native";
import { Button } from "./Button";
import type { OfensivaAcesa } from "../utils/ofensivaUtils";

const StaticFirework = ({ size, color, opacity }: { size: number; color: string; opacity: number }) => (
  <Svg width={size} height={size} viewBox="0 0 44 44" opacity={opacity} accessible={false}>
    {Array.from({ length: 12 }, (_, index) => {
      const angle = index * Math.PI / 6;
      const inner = index % 2 === 0 ? 8 : 10;
      const outer = index % 2 === 0 ? 17 : 19;
      return <Line key={index} x1={22 + Math.cos(angle) * inner} y1={22 + Math.sin(angle) * inner}
        x2={22 + Math.cos(angle) * outer} y2={22 + Math.sin(angle) * outer}
        stroke={color} strokeWidth={1.3} strokeLinecap="round" />;
    })}
    <Circle cx={22} cy={22} r={1.3} fill={color} opacity={0.55} />
  </Svg>
);

export const StreakCelebration = ({ conquista, onClose }: { conquista: OfensivaAcesa | null; onClose: () => void }) => {
  const [reduzirMovimento, setReduzirMovimento] = useState(true);

  useEffect(() => {
    let ativo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduzir) => {
      if (ativo) setReduzirMovimento(reduzir);
    }).catch(() => { /* Keep motion disabled if the preference cannot be read. */ });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduzirMovimento);
    return () => { ativo = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (conquista) AccessibilityInfo.announceForAccessibility(`Sua ofensiva está acesa! ${conquista.dias} ${conquista.dias === 1 ? "dia" : "dias"} de ofensiva. Mais ${conquista.xpNovo} pontos de experiência.`);
  }, [conquista]);

  return <Modal visible={Boolean(conquista)} transparent animationType={reduzirMovimento ? "none" : "fade"} onRequestClose={onClose} statusBarTranslucent>
    <View style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.art}>
            <View style={styles.glow} />
            <View style={styles.fireworks} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.fireworkLeft}><StaticFirework size={34} color="#C99B3B" opacity={0.55} /></View>
              <View style={styles.fireworkRight}><StaticFirework size={30} color="#DFA23E" opacity={0.5} /></View>
              <View style={styles.fireworkBottom}><StaticFirework size={25} color="#1D4B62" opacity={0.35} /></View>
            </View>
            <Image source={require("../../assets/mascote-celebracao.png")} style={styles.mascot} resizeMode="contain" accessible={false} />
          </View>
          <View style={styles.streakPill}><Flame size={20} color="#EA580C" fill="#FDBA74" /><Text style={styles.streakText}>{conquista?.dias} {conquista?.dias === 1 ? "dia" : "dias"} de ofensiva</Text></View>
          <Text style={styles.title} accessibilityRole="header">Sua ofensiva está acesa!</Text>
          <Text style={styles.copy}>Você fez sua atividade de hoje. Seu StudyMate está comemorando com você!</Text>
          <Text style={styles.xp}>+{conquista?.xpNovo} XP conquistados</Text>
          <Text style={styles.reminder}>Volte amanhã e mantenha essa chama.</Text>
          <Button title="Continuar estudando" onPress={onClose} style={styles.button} />
        </View>
      </ScrollView>
    </View>
  </Modal>;
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.65)" },
  scrollContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 22, paddingVertical: 40 },
  card: { width: "100%", maxWidth: 400, backgroundColor: "#FFFFFF", borderRadius: 28, padding: 24, alignItems: "center", borderWidth: 2, borderColor: "#FFEDD5" },
  art: { width: "100%", height: 210, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  glow: { position: "absolute", width: 172, height: 172, borderRadius: 86, backgroundColor: "#FFF7ED", borderWidth: 10, borderColor: "#FFEDD5" },
  mascot: { width: 152, height: 176 },
  fireworks: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
  fireworkLeft: { position: "absolute", left: 0, top: 40 },
  fireworkRight: { position: "absolute", right: 0, top: 8 },
  fireworkBottom: { position: "absolute", left: 9, bottom: 12 },
  streakPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF7ED", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, marginBottom: 14 },
  streakText: { fontSize: 13, fontWeight: "800", color: "#C2410C" },
  title: { fontSize: 25, lineHeight: 31, fontWeight: "800", color: "#0F172A", textAlign: "center", marginBottom: 9 },
  copy: { fontSize: 14, lineHeight: 22, color: "#64748B", textAlign: "center" },
  xp: { fontSize: 20, fontWeight: "800", color: "#2563EB", marginTop: 20 },
  reminder: { fontSize: 12, color: "#64748B", textAlign: "center", marginTop: 7 },
  button: { width: "100%", marginTop: 24 },
});
