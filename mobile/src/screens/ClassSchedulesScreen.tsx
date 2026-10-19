import React, {
  useEffect,
  useState,
} from "react";

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

import {
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import type {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import type {
  RouteProp,
} from "@react-navigation/native";

import type {
  HorarioAulaResponse,
  RootStackParamList,
} from "../types";

import {
  listarHorariosAula,
  excluirHorarioAula,
} from "../services/horarioAulaService";

import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

import {
  Clock,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react-native";

export const ClassSchedulesScreen: React.FC =
  () => {
    const navigation =
      useNavigation<
        NativeStackNavigationProp<RootStackParamList>
      >();

    const route =
      useRoute<
        RouteProp<
          RootStackParamList,
          "ClassSchedules"
        >
      >();

    const isFocused = useIsFocused();

    const {
      idDisciplina,
      nomeDisciplina,
    } = route.params;

    const [
      horarios,
      setHorarios,
    ] = useState<HorarioAulaResponse[]>([]);

    const [
      carregando,
      setCarregando,
    ] = useState(true);

    const showAlert = (
      title: string,
      message: string
    ) => {
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined"
      ) {
        window.alert(`${title}: ${message}`);
      } else {
        Alert.alert(title, message);
      }
    };

    const carregarHorarios = async () => {
      try {
        setCarregando(true);

        const dados =
          await listarHorariosAula(
            idDisciplina
          );

        setHorarios(dados);
      } catch (error) {
        showAlert(
          "Erro",
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os horários de aula."
        );
      } finally {
        setCarregando(false);
      }
    };

    useEffect(() => {
      if (isFocused) {
        void carregarHorarios();
      }
    }, [isFocused, idDisciplina]);

    const excluirHorarioSelecionado =
      async (idHorario: number) => {
        try {
          setCarregando(true);

          await excluirHorarioAula(
            idHorario
          );

          await carregarHorarios();
        } catch (error) {
          showAlert(
            "Erro",
            error instanceof Error
              ? error.message
              : "Não foi possível excluir o horário de aula."
          );
        } finally {
          setCarregando(false);
        }
      };

    const handleExcluir = (
      idHorario: number
    ) => {
      const mensagem =
        "Deseja realmente excluir este horário de aula?";

      if (
        Platform.OS === "web" &&
        typeof window !== "undefined"
      ) {
        if (window.confirm(mensagem)) {
          void excluirHorarioSelecionado(
            idHorario
          );
        }

        return;
      }

      Alert.alert(
        "Confirmação",
        mensagem,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Excluir",
            style: "destructive",
            onPress: () =>
              void excluirHorarioSelecionado(
                idHorario
              ),
          },
        ]
      );
    };

    const renderHorario = ({
      item,
    }: {
      item: HorarioAulaResponse;
    }) => (
      <Card style={styles.scheduleCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.dayText}>
              {item.diaSemana}
            </Text>

            <View style={styles.infoRow}>
              <Clock
                size={15}
                color="#64748B"
              />

              <Text style={styles.infoText}>
                {item.horaInicio} às{" "}
                {item.horaFim}
              </Text>
            </View>

            {item.local ? (
              <View style={styles.infoRow}>
                <MapPin
                  size={15}
                  color="#64748B"
                />

                <Text
                  style={styles.infoText}
                >
                  {item.local}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Button
            title="Editar"
            variant="outline"
            size="sm"
            icon={
              <Pencil
                size={14}
                color="#334155"
              />
            }
            onPress={() =>
              navigation.navigate(
                "EditClassSchedule",
                {
                  idHorario:
                    item.idHorario,
                  idDisciplina,
                  nomeDisciplina,
                }
              )
            }
            style={styles.actionButton}
          />

          <Button
            title="Excluir"
            variant="destructive"
            size="sm"
            icon={
              <Trash2
                size={14}
                color="#FFFFFF"
              />
            }
            onPress={() =>
              handleExcluir(
                item.idHorario
              )
            }
            style={styles.actionButton}
          />
        </View>
      </Card>
    );

    return (
      <View style={styles.container}>
        <MobileHeader
          title="Horários de aula"
          showBack
          onBack={() =>
            navigation.goBack()
          }
        />

        <View style={styles.content}>
          <Text style={styles.subjectName}>
            {nomeDisciplina}
          </Text>

          {carregando ? (
            <View
              style={
                styles.loadingContainer
              }
            >
              <ActivityIndicator
                size="large"
                color="#2563EB"
              />

              <Text
                style={styles.loadingText}
              >
                Carregando horários...
              </Text>
            </View>
          ) : (
            <FlatList
              data={horarios}
              keyExtractor={(item) =>
                item.idHorario.toString()
              }
              renderItem={renderHorario}
              contentContainerStyle={
                styles.listContent
              }
              ListEmptyComponent={
                <Card
                  style={styles.emptyCard}
                >
                  <Text
                    style={styles.emptyTitle}
                  >
                    Nenhum horário cadastrado
                  </Text>

                  <Text
                    style={
                      styles.emptySubtitle
                    }
                  >
                    Cadastre os horários
                    das aulas desta
                    disciplina.
                  </Text>

                  <Button
                    title="Cadastrar horário"
                    icon={
                      <Plus
                        size={16}
                        color="#FFFFFF"
                      />
                    }
                    onPress={() =>
                      navigation.navigate(
                        "NewClassSchedule",
                        {
                          idDisciplina,
                          nomeDisciplina,
                        }
                      )
                    }
                  />
                </Card>
              }
            />
          )}
        </View>

        <Pressable
          onPress={() =>
            navigation.navigate(
              "NewClassSchedule",
              {
                idDisciplina,
                nomeDisciplina,
              }
            )
          }
          style={styles.fab}
        >
          <Plus
            size={24}
            color="#FFFFFF"
          />
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

  subjectName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },

  loadingContainer: {
    padding: 32,
    alignItems: "center",
  },

  loadingText: {
    marginTop: 8,
    color: "#64748B",
  },

  listContent: {
    paddingBottom: 90,
  },

  scheduleCard: {
    marginBottom: 12,
  },

  cardHeader: {
    marginBottom: 14,
  },

  dayText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },

  infoText: {
    fontSize: 14,
    color: "#64748B",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },

  actionButton: {
    flex: 1,
  },

  emptyCard: {
    alignItems: "center",
    padding: 24,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 18,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
});