import React from "react";

import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  RefreshCw,
} from "lucide-react-native";

type LastSyncStatusProps = {
  lastSyncAt: string | null;
};

function formatarUltimaSincronizacao(
  lastSyncAt: string | null
): string {
  if (!lastSyncAt) {
    return "Ainda não sincronizado";
  }

  const data =
    new Date(lastSyncAt);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "Sincronização indisponível";
  }

  const agora =
    new Date();

  const mesmoDia =
    data.getFullYear() ===
      agora.getFullYear() &&
    data.getMonth() ===
      agora.getMonth() &&
    data.getDate() ===
      agora.getDate();

  const horario =
    data.toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  if (mesmoDia) {
    return `Última sincronização hoje às ${horario}`;
  }

  const dataFormatada =
    data.toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
      }
    );

  return `Última sincronização em ${dataFormatada} às ${horario}`;
}

export const LastSyncStatus:
  React.FC<LastSyncStatusProps> = ({
    lastSyncAt,
  }) => {
    return (
      <View style={styles.container}>
        <RefreshCw
          size={13}
          color="#64748B"
        />

        <Text style={styles.text}>
          {formatarUltimaSincronizacao(
            lastSyncAt
          )}
        </Text>
      </View>
    );
  };

const styles =
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    text: {
      fontSize: 11,
      color: "#64748B",
    },
  });