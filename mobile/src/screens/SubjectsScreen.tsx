import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, DisciplinaResponse } from "../types";
import {
  listarDisciplinas,
  excluirDisciplina,
} from "../services/disciplinaService";
import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Search, Users, Clock, Plus, Trash2, Pencil } from "lucide-react-native";

export const SubjectsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();

  const [disciplinas, setDisciplinas] = useState<DisciplinaResponse[]>([]);
  const [termoBusca, setTermoBusca] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const carregarDisciplinas = async (termo?: string) => {
    setIsLoading(true);
    try {
      const dados = await listarDisciplinas(termo);
      setDisciplinas(dados);
    } catch (error) {
      showAlert(
        "Erro",
        error instanceof Error ? error.message : "Erro ao carregar disciplinas."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcluir = async (idDisciplina: number) => {
    const confirmar = () => {
      excluirDisciplina(idDisciplina)
        .then(() => carregarDisciplinas(termoBusca))
        .catch((error) =>
          showAlert(
            "Erro",
            error instanceof Error ? error.message : "Erro ao excluir disciplina."
          )
        );
    };

    if (Platform.OS === "web") {
      if (window.confirm("Deseja realmente excluir esta disciplina?")) {
        confirmar();
      }
    } else {
      Alert.alert("Confirmação", "Deseja realmente excluir esta disciplina?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: confirmar },
      ]);
    }
  };

  useEffect(() => {
    if (isFocused) {
      carregarDisciplinas(termoBusca);
    }
  }, [isFocused]);

  const renderDisciplinaItem = ({ item }: { item: DisciplinaResponse }) => (
    <Card style={styles.subjectCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.subjectTitle}>{item.nome}</Text>
          <View style={styles.professorRow}>
            <Users size={14} color="#64748B" />
            <Text style={styles.professorText}>
              {item.professor || "Professor não informado"}
            </Text>
          </View>
        </View>
        <View style={styles.gradeBadge}>
          <Text style={styles.gradeText}>{item.mediaAprovacao}</Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Período</Text>
          <Text style={styles.detailValue}>{item.idPeriodo}</Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Limite de faltas</Text>
          <Text style={styles.detailValue}>{item.limiteFaltas}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.idRow}>
          <Clock size={13} color="#94A3B8" />
          <Text style={styles.idText}>ID: {item.idDisciplina}</Text>
        </View>

        <View style={styles.actionsRow}>
          <Button
            title="Editar"
            variant="outline"
            size="sm"
            icon={<Pencil size={14} color="#334155" />}
            onPress={() =>
              navigation.navigate("EditSubject", {
                idDisciplina: item.idDisciplina,
              })
            }
            style={styles.actionButton}
          />
          <Button
            title="Excluir"
            variant="destructive"
            size="sm"
            icon={<Trash2 size={14} color="#FFFFFF" />}
            onPress={() => handleExcluir(item.idDisciplina)}
            style={styles.actionButton}
          />
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <MobileHeader title="Disciplinas" />

      <View style={styles.content}>
        {/* Barra de Pesquisa */}
        <Card style={styles.searchCard}>
          <Input
            placeholder="Pesquisar por nome ou professor..."
            value={termoBusca}
            onChangeText={setTermoBusca}
            leftIcon={<Search size={18} color="#94A3B8" />}
            containerStyle={styles.searchInputContainer}
          />
          <View style={styles.searchButtonsRow}>
            <Button
              title="Pesquisar"
              onPress={() => carregarDisciplinas(termoBusca)}
              style={styles.searchButton}
            />
            <Button
              title="Limpar"
              variant="outline"
              onPress={() => {
                setTermoBusca("");
                carregarDisciplinas("");
              }}
              style={styles.clearButton}
            />
          </View>
        </Card>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Carregando disciplinas...</Text>
          </View>
        ) : (
          <FlatList
            data={disciplinas}
            keyExtractor={(item) => item.idDisciplina.toString()}
            renderItem={renderDisciplinaItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  Nenhuma disciplina encontrada
                </Text>
                <Text style={styles.emptySubtitle}>
                  Cadastre suas matérias para organizar seus estudos e faltas.
                </Text>
                <Button
                  title="Cadastrar disciplina"
                  icon={<Plus size={16} color="#FFFFFF" />}
                  onPress={() => navigation.navigate("NewSubject")}
                  style={styles.emptyButton}
                />
              </Card>
            }
          />
        )}
      </View>

      {/* FAB Cadastrar */}
      <Pressable
        onPress={() => navigation.navigate("NewSubject")}
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
  content: {
    flex: 1,
    padding: 16,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  searchCard: {
    marginBottom: 16,
    padding: 14,
  },
  searchInputContainer: {
    marginBottom: 10,
  },
  searchButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  searchButton: {
    flex: 1,
  },
  clearButton: {
    flex: 1,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 80,
  },
  subjectCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderInfo: {
    flex: 1,
    marginRight: 8,
  },
  subjectTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  professorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  professorText: {
    fontSize: 13,
    color: "#64748B",
    marginLeft: 6,
  },
  gradeBadge: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563EB",
  },
  detailsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  detailBox: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    padding: 8,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  idText: {
    fontSize: 12,
    color: "#94A3B8",
    marginLeft: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  emptyCard: {
    padding: 24,
    alignItems: "center",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 4,
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
