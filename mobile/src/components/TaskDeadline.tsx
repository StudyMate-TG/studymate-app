import React from "react";

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import {
  CalendarClock,
} from "lucide-react-native";

type TaskDeadlineProps = {
  dataEntrega: string;
  compact?: boolean;
};

export const TaskDeadline: React.FC<
  TaskDeadlineProps
> = ({
  dataEntrega,
  compact = false,
}) => {
  const formatarDataHora = (
    valor: string
  ) => {
    if (!valor) {
      return {
        data: "--/--/----",
        hora: "--:--",
      };
    }

    const [dataParte, horaParte] =
      valor.split("T");

    const [ano, mes, dia] =
      dataParte.split("-");

    const hora =
      horaParte
        ? horaParte.substring(0, 5)
        : "--:--";

    return {
      data:
        ano && mes && dia
          ? `${dia}/${mes}/${ano}`
          : valor,

      hora,
    };
  };

  const { data, hora } =
    formatarDataHora(dataEntrega);

  return (
    <View
  style={[
    styles.container,
    compact && styles.containerCompact,
  ]}
>      <View style={styles.iconContainer}>
        <CalendarClock
          size={18}
          color="#2563EB"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>
          Entrega
        </Text>

        <View style={styles.valueRow}>
          <Text style={styles.date}>
            {data}
          </Text>

          <View style={styles.timeBadge}>
            <Text style={styles.time}>
              {hora}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    },

  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  content: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 3,
  },

  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  date: {
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "700",
  },

  timeBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginLeft: 8,
  },

  time: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "700",
  },

  containerCompact: {
    marginTop: 0,
  },
});