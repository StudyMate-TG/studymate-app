import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react-native";

export const CalendarScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthLabel = useMemo(() => {
    return selectedDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  const weekDays = useMemo(() => {
    const baseDate = new Date(selectedDate);
    const currentDay = baseDate.getDay();

    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - currentDay);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);

      return {
        fullDate: date,
        dayNumber: date.getDate().toString().padStart(2, "0"),
        dayName: date
          .toLocaleDateString("pt-BR", { weekday: "short" })
          .replace(".", "")
          .toUpperCase(),
        isSelected: date.toDateString() === selectedDate.toDateString(),
      };
    });
  }, [selectedDate]);

  const goToPreviousMonth = () => {
    setSelectedDate((curr) => {
      const d = new Date(curr);
      d.setMonth(curr.getMonth() - 1);
      return d;
    });
  };

  const goToNextMonth = () => {
    setSelectedDate((curr) => {
      const d = new Date(curr);
      d.setMonth(curr.getMonth() + 1);
      return d;
    });
  };

  return (
    <View style={styles.container}>
      <MobileHeader title="Calendário" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Navegação de Mês */}
        <Card style={styles.monthCard}>
          <View style={styles.monthRow}>
            <Pressable onPress={goToPreviousMonth} style={styles.monthArrow}>
              <ChevronLeft size={22} color="#0F172A" />
            </Pressable>
            <View style={styles.monthCenter}>
              <Text style={styles.monthTitle}>{monthLabel}</Text>
              <Text style={styles.monthSubtitle}>Eventos acadêmicos</Text>
            </View>
            <Pressable onPress={goToNextMonth} style={styles.monthArrow}>
              <ChevronRight size={22} color="#0F172A" />
            </Pressable>
          </View>
        </Card>

        {/* Faixa Semanal */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekContainer}
        >
          {weekDays.map((day, index) => (
            <Pressable
              key={index}
              onPress={() => setSelectedDate(day.fullDate)}
              style={[
                styles.dayButton,
                day.isSelected && styles.dayButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.dayName,
                  day.isSelected && styles.dayNameSelected,
                ]}
              >
                {day.dayName}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  day.isSelected && styles.dayNumberSelected,
                ]}
              >
                {day.dayNumber}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Resumo do Calendário */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <CalendarIcon size={20} color="#2563EB" />
            <Text style={styles.summaryTitle}>Resumo do calendário</Text>
          </View>
          <Text style={styles.summaryText}>
            Os eventos acadêmicos serão exibidos após a integração com o backend.
          </Text>
        </Card>

        {/* Lista de Eventos */}
        <Card style={styles.eventsCard}>
          <Text style={styles.eventsEmptyText}>
            Nenhum evento cadastrado para esta data.
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
  monthCard: {
    marginBottom: 16,
    padding: 12,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthArrow: {
    padding: 8,
    borderRadius: 8,
  },
  monthCenter: {
    alignItems: "center",
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    textTransform: "capitalize",
  },
  monthSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  weekContainer: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 16,
  },
  dayButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 56,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dayButtonSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  dayName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  dayNameSelected: {
    color: "#FFFFFF",
    opacity: 0.9,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  dayNumberSelected: {
    color: "#FFFFFF",
  },
  summaryCard: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  summaryText: {
    fontSize: 13,
    color: "#3B82F6",
  },
  eventsCard: {
    padding: 24,
    alignItems: "center",
  },
  eventsEmptyText: {
    fontSize: 14,
    color: "#64748B",
  },
});
