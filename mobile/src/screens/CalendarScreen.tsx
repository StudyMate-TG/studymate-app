import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";

import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";

import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react-native";

import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types";
import { obterUsuarioSessao } from "../services/authService";
import * as tarefaService from "../services/tarefaService.web";
import type { TarefaResponse } from "../services/tarefaService.web";
import { formatarPrioridade } from "../utils/tarefaUtils";
import { TaskDeadline } from "../components/TaskDeadline";


export const CalendarScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const navigation =
  useNavigation<NativeStackNavigationProp<RootStackParamList>>();

const isFocused = useIsFocused();

const [tarefas, setTarefas] = useState<TarefaResponse[]>([]);
useEffect(() => {
  const carregarTarefas = async () => {
    try {
      const usuario = await obterUsuarioSessao();

      if (!usuario?.idUsuario) {
        setTarefas([]);
        return;
      }
      
     const dados = await tarefaService.listarTarefas(
  usuario.idUsuario
);

console.log("TAREFAS RECEBIDAS NA AGENDA:", dados);

setTarefas(dados);
    } catch (error) {
      console.error("Erro ao carregar tarefas da agenda:", error);
      setTarefas([]);
    }
  };

  if (isFocused) {
    carregarTarefas();
  }
}, [isFocused]);

const tarefasDoDia = useMemo(() => {
  const ano = selectedDate.getFullYear();
  const mes = String(selectedDate.getMonth() + 1).padStart(2, "0");
  const dia = String(selectedDate.getDate()).padStart(2, "0");

  const dataSelecionada = `${ano}-${mes}-${dia}`;

  return tarefas.filter((tarefa) => {
    if (!tarefa.dataEntrega) {
      return false;
    }

    const dataEntrega = tarefa.dataEntrega.substring(0, 10);

    return dataEntrega === dataSelecionada;
  });
}, [tarefas, selectedDate]);

  const monthLabel = useMemo(() => {
    return selectedDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  const selectedDateLabel = useMemo(() => {
    return selectedDate.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  }, [selectedDate]);

  const monthDays = useMemo(() => {
  const ano = selectedDate.getFullYear();
  const mes = selectedDate.getMonth();

  const primeiroDiaDoMes = new Date(ano, mes, 1);
  const ultimoDiaDoMes = new Date(ano, mes + 1, 0);

  const quantidadeDias = ultimoDiaDoMes.getDate();
  const diaSemanaInicial = primeiroDiaDoMes.getDay();

  const dias: Array<{
    fullDate: Date;
    key: string;
    dayNumber: number;
    isSelected: boolean;
    hasTask: boolean;
  } | null> = [];

  // Espaços vazios antes do primeiro dia do mês
  for (let i = 0; i < diaSemanaInicial; i++) {
    dias.push(null);
  }

  // Dias do mês
  for (let dia = 1; dia <= quantidadeDias; dia++) {
    const date = new Date(ano, mes, dia);

    const dataFormatada =
      `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    const isSelected =
      selectedDate.getFullYear() === ano &&
      selectedDate.getMonth() === mes &&
      selectedDate.getDate() === dia;

    const hasTask = tarefas.some((tarefa) => {
      if (!tarefa.dataEntrega) {
        return false;
      }

      return tarefa.dataEntrega.substring(0, 10) === dataFormatada;
    });

    dias.push({
      fullDate: date,
      key: dataFormatada,
      dayNumber: dia,
      isSelected,
      hasTask,
    });
  }

  return dias;
}, [selectedDate, tarefas]);

  //mudança dia 07/10
 const goToPreviousMonth = () => {
  setSelectedDate((currentDate) => {
    return new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
  });
};

const goToNextMonth = () => {
  setSelectedDate((currentDate) => {
    return new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
  });
};

  return (
    <View style={styles.container}>
      <MobileHeader title="Agenda" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.monthCard}>
          <View style={styles.monthRow}>
            <Pressable onPress={goToPreviousMonth} style={styles.monthArrow}>
              <ChevronLeft size={22} color="#0F172A" />
            </Pressable>

            <View style={styles.monthCenter}>
              <Text style={styles.monthTitle}>{monthLabel}</Text>
              <Text style={styles.monthSubtitle}>Agenda acadêmica</Text>
            </View>

            <Pressable onPress={goToNextMonth} style={styles.monthArrow}>
              <ChevronRight size={22} color="#0F172A" />
            </Pressable>
          </View>
        </Card>

        <Card style={styles.calendarCard}>
  <View style={styles.weekHeader}>
    {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map(
      (dia) => (
        <Text key={dia} style={styles.weekHeaderText}>
          {dia}
        </Text>
      )
    )}
  </View>

  <View style={styles.calendarGrid}>
    {monthDays.map((day, index) => {
      if (!day) {
        return (
          <View
            key={`empty-${index}`}
            style={styles.calendarDayContainer}
          />
        );
      }

      return (
        <View
          key={day.key}
          style={styles.calendarDayContainer}
        >
          <Pressable
            onPress={() => setSelectedDate(day.fullDate)}
            style={[
              styles.calendarDay,
              day.isSelected && styles.calendarDaySelected,
            ]}
          >
            <Text
              style={[
                styles.calendarDayText,
                day.isSelected &&
                  styles.calendarDayTextSelected,
              ]}
            >
              {day.dayNumber}
            </Text>

            {day.hasTask && (
              <View
                style={[
                  styles.taskDot,
                  day.isSelected && styles.taskDotSelected,
                ]}
              />
            )}
          </Pressable>
        </View>
      );
    })}
  </View>
</Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <CalendarIcon size={20} color="#2563EB" />
            <Text style={styles.summaryTitle}>Resumo da agenda</Text>
          </View>

          <Text style={styles.summaryDate}>{selectedDateLabel}</Text>

          <Text style={styles.summaryText}>
  {tarefasDoDia.length === 0
    ? "Nenhuma tarefa com entrega neste dia."
    : tarefasDoDia.length === 1
    ? "1 tarefa com entrega neste dia."
    : `${tarefasDoDia.length} tarefas com entrega neste dia.`}
</Text>
        </Card>

        {tarefasDoDia.length === 0 ? (
  <Card style={styles.eventsCard}>
    <Text style={styles.eventsEmptyTitle}>
      Nenhuma tarefa para este dia
    </Text>

    <Text style={styles.eventsEmptyText}>
      Não existem tarefas com entrega na data selecionada.
    </Text>
  </Card>
) : (
  tarefasDoDia.map((tarefa) => (
    <Pressable
      key={
        tarefa.localId ??
        String(tarefa.idTarefa)
      }
      onPress={() =>
        navigation.navigate("EditTask", {
          idTarefa: tarefa.idTarefa,
          localId: tarefa.localId,
        })
      }
    >
      <Card style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <View style={styles.taskContent}>
            <Text style={styles.taskTitle}>
              {tarefa.titulo}
            </Text>

            <Text style={styles.taskSubject}>
              {tarefa.nomeDisciplina}
            </Text>
          </View>

          <Text style={styles.taskPriority}>
            {formatarPrioridade(tarefa.prioridade)}
          </Text>
        </View>
        <TaskDeadline
          dataEntrega={tarefa.dataEntrega}
          compact
        />
      </Card>
    </Pressable>
  ))
)}
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

calendarCard: {
  marginBottom: 16,
  padding: 12,
},

weekHeader: {
  flexDirection: "row",
  marginBottom: 8,
},

weekHeaderText: {
  width: "14.2857%",
  textAlign: "center",
  fontSize: 10,
  fontWeight: "700",
  color: "#64748B",
},

calendarGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
},

calendarDayContainer: {
  width: "14.2857%",
  alignItems: "center",
  marginBottom: 6,
},

calendarDay: {
  width: 38,
  height: 42,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 10,
},

calendarDaySelected: {
  backgroundColor: "#2563EB",
},

calendarDayText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#0F172A",
},

calendarDayTextSelected: {
  color: "#FFFFFF",
},

taskDot: {
  width: 5,
  height: 5,
  borderRadius: 3,
  backgroundColor: "#2563EB",
  marginTop: 3,
},

taskDotSelected: {
  backgroundColor: "#FFFFFF",
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

  summaryDate: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1D4ED8",
    textTransform: "capitalize",
    marginBottom: 4,
  },

  summaryText: {
    fontSize: 13,
    color: "#3B82F6",
  },

  eventsCard: {
    padding: 24,
    alignItems: "center",
  },

  eventsEmptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
    textAlign: "center",
  },

  eventsEmptyText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
  taskCard: {
  marginBottom: 12,
},

taskHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
},

taskContent: {
  flex: 1,
  marginRight: 12,
},

taskTitle: {
  fontSize: 15,
  fontWeight: "700",
  color: "#0F172A",
},

taskSubject: {
  fontSize: 13,
  color: "#64748B",
  marginTop: 4,
},

taskPriority: {
  fontSize: 11,
  fontWeight: "700",
  color: "#2563EB",
},
});