import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from "react-native";

import {
  ArrowLeft,
  Plus,
  CalendarDays,
  GraduationCap,
} from "lucide-react-native";

import { RootStackScreenProps } from "../types";

type Props = RootStackScreenProps<"Evaluations">;

type Avaliacao = {
  idAvaliacao: number;
  nome: string;
  tipo: string;
  nota: number | null;
  peso: number;
  dataAvaliacao: string;
};

export const EvaluationsScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { idDisciplina, nomeDisciplina } = route.params;

  const [avaliacoes] = useState<Avaliacao[]>([]);

  const formatarData = (data: string) => {
    if (!data) {
      return "-";
    }

    const partes = data.split("-");

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const abrirNovaAvaliacao = () => {
    navigation.navigate("NewEvaluation", {
      idDisciplina,
      nomeDisciplina,
    });
  };

  const renderAvaliacao = ({ item }: { item: Avaliacao }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <GraduationCap
              size={22}
              color="#2563EB"
            />

            <View style={styles.titleWrapper}>
              <Text style={styles.cardTitle}>
                {item.nome}
              </Text>

              <Text style={styles.tipo}>
                {item.tipo}
              </Text>
            </View>
          </View>

          <View style={styles.notaContainer}>
            <Text style={styles.notaLabel}>
              Nota
            </Text>

            <Text style={styles.nota}>
              {item.nota !== null
                ? item.nota.toFixed(1)
                : "-"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <CalendarDays
            size={17}
            color="#64748B"
          />

          <Text style={styles.infoText}>
            {formatarData(item.dataAvaliacao)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Peso:
          </Text>

          <Text style={styles.infoText}>
            {item.peso}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft
            size={24}
            color="#0F172A"
          />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Avaliações
          </Text>

          <Text style={styles.subjectName}>
            {nomeDisciplina}
          </Text>
        </View>
      </View>

      <FlatList
        data={avaliacoes}
        keyExtractor={(item) =>
          item.idAvaliacao.toString()
        }
        renderItem={renderAvaliacao}
        contentContainerStyle={
          avaliacoes.length === 0
            ? styles.emptyList
            : styles.list
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <GraduationCap
                size={42}
                color="#2563EB"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Nenhuma avaliação cadastrada
            </Text>

            <Text style={styles.emptyText}>
              Cadastre provas, trabalhos e outras
              avaliações desta disciplina.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={abrirNovaAvaliacao}
            >
              <Plus
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.emptyButtonText}>
                Nova Avaliação
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {avaliacoes.length > 0 && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={abrirNovaAvaliacao}
        >
          <Plus
            size={26}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    marginRight: 14,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },

  subjectName: {
    marginTop: 2,
    fontSize: 14,
    color: "#64748B",
  },

  list: {
    padding: 20,
    paddingBottom: 100,
  },

  emptyList: {
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    backgroundColor: "#2563EB",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
  },

  emptyButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  cardTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  titleWrapper: {
    flex: 1,
    marginLeft: 12,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },

  tipo: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },

  notaContainer: {
    alignItems: "center",
    minWidth: 55,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
  },

  notaLabel: {
    fontSize: 11,
    color: "#64748B",
  },

  nota: {
    marginTop: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#2563EB",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 14,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginRight: 5,
  },

  infoText: {
    fontSize: 14,
    color: "#64748B",
    marginLeft: 6,
  },

  floatingButton: {
    position: "absolute",
    right: 22,
    bottom: 26,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
});