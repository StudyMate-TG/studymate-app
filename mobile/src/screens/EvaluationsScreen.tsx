import React, {
  useCallback,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";

import {
  ArrowLeft,
  Plus,
  CalendarDays,
  GraduationCap,
  Trash2,
  Pencil,
} from "lucide-react-native";

import {
  useFocusEffect,
} from "@react-navigation/native";

import {
  RootStackScreenProps,
} from "../types";

import {
  obterUsuarioSessao,
} from "../services/authService";

import {
  listarAvaliacoes,
  buscarMediaDisciplina,
  excluirAvaliacao,
  AvaliacaoResponse,
  MediaDisciplinaResponse,
} from "../services/avaliacaoService";

type Props =
  RootStackScreenProps<"Evaluations">;

export const EvaluationsScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const {
    idDisciplina,
    nomeDisciplina,
  } = route.params;

  const [
    avaliacoes,
    setAvaliacoes,
  ] = useState<AvaliacaoResponse[]>([]);

  const [
    mediaDisciplina,
    setMediaDisciplina,
  ] =
    useState<MediaDisciplinaResponse | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    excluindo,
    setExcluindo,
  ] = useState<number | null>(
    null
  );

  const mostrarAlerta = (
    titulo: string,
    mensagem: string
  ) => {
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined"
    ) {
      window.alert(
        `${titulo}: ${mensagem}`
      );

      return;
    }

    Alert.alert(
      titulo,
      mensagem
    );
  };

  const obterIdUsuarioLogado =
    async (): Promise<number> => {
      const usuario =
        await obterUsuarioSessao();

      if (!usuario?.idUsuario) {
        throw new Error(
          "Usuário não encontrado. Faça login novamente."
        );
      }

      return usuario.idUsuario;
    };

  const carregarDados =
    useCallback(
      async () => {
        try {
          setCarregando(true);

          const idUsuario =
            await obterIdUsuarioLogado();

          const [
            dadosAvaliacoes,
            dadosMedia,
          ] =
            await Promise.all([
              listarAvaliacoes(
                idUsuario,
                idDisciplina
              ),

              buscarMediaDisciplina(
                idUsuario,
                idDisciplina
              ),
            ]);

          setAvaliacoes(
            dadosAvaliacoes
          );

          setMediaDisciplina(
            dadosMedia
          );
        } catch (error) {
          mostrarAlerta(
            "Erro",
            error instanceof Error
              ? error.message
              : "Erro ao carregar avaliações."
          );
        } finally {
          setCarregando(false);
        }
      },
      [idDisciplina]
    );

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  const formatarData = (
    data: string
  ) => {
    if (!data) {
      return "-";
    }

    const partes =
      data.split("-");

    if (
      partes.length !== 3
    ) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const formatarNumero = (
    valor: number
  ) => {
    return valor
      .toFixed(2)
      .replace(".", ",");
  };

  const abrirNovaAvaliacao =
    () => {
      navigation.navigate(
        "NewEvaluation",
        {
          idDisciplina,
          nomeDisciplina,
        }
      );
    };

  const abrirEdicao = (
    avaliacao: AvaliacaoResponse
  ) => {
    navigation.navigate(
      "EditEvaluation",
      {
        idAvaliacao:
          avaliacao.idAvaliacao,

        idDisciplina:
          avaliacao.idDisciplina,

        nomeDisciplina,
      }
    );
  };

  const executarExclusao =
    async (
      idAvaliacao: number
    ) => {
      try {
        setExcluindo(
          idAvaliacao
        );

        const idUsuario =
          await obterIdUsuarioLogado();

        await excluirAvaliacao(
          idAvaliacao,
          idUsuario
        );

        await carregarDados();
      } catch (error) {
        mostrarAlerta(
          "Erro",
          error instanceof Error
            ? error.message
            : "Erro ao excluir avaliação."
        );
      } finally {
        setExcluindo(null);
      }
    };

  const confirmarExclusao =
    (
      avaliacao:
        AvaliacaoResponse
    ) => {
      if (
        Platform.OS ===
          "web" &&
        typeof window !==
          "undefined"
      ) {
        const confirmou =
          window.confirm(
            `Deseja excluir a avaliação "${avaliacao.nome}"?`
          );

        if (confirmou) {
          executarExclusao(
            avaliacao.idAvaliacao
          );
        }

        return;
      }

      Alert.alert(
        "Excluir avaliação",
        `Deseja excluir a avaliação "${avaliacao.nome}"?`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },

          {
            text: "Excluir",
            style:
              "destructive",

            onPress: () =>
              executarExclusao(
                avaliacao.idAvaliacao
              ),
          },
        ]
      );
    };

  const renderAvaliacao = ({
    item,
  }: {
    item: AvaliacaoResponse;
  }) => {
    const estaExcluindo =
      excluindo ===
      item.idAvaliacao;

    return (
      <View
        style={styles.card}
      >
        <View
          style={
            styles.cardHeader
          }
        >
          <View
            style={
              styles.cardTitleContainer
            }
          >
            <View
              style={
                styles.iconContainer
              }
            >
              <GraduationCap
                size={21}
                color="#2563EB"
              />
            </View>

            <View
              style={
                styles.titleWrapper
              }
            >
              <Text
                style={
                  styles.cardTitle
                }
              >
                {item.nome}
              </Text>

              <Text
                style={styles.tipo}
              >
                {item.tipo}
              </Text>
            </View>
          </View>

          <View
            style={
              item.nota !== null
                ? styles.notaContainer
                : styles.notaPendenteContainer
            }
          >
            <Text
              style={
                styles.notaLabel
              }
            >
              Nota
            </Text>

            <Text
              style={
                item.nota !== null
                  ? styles.nota
                  : styles.notaPendente
              }
            >
              {item.nota !== null
                ? formatarNumero(
                    item.nota
                  )
                : "-"}
            </Text>
          </View>
        </View>

        <View
          style={styles.divider}
        />

        <View
          style={styles.infoRow}
        >
          <CalendarDays
            size={17}
            color="#64748B"
          />

          <Text
            style={
              styles.infoText
            }
          >
            {formatarData(
              item.dataAvaliacao
            )}
          </Text>
        </View>

        <View
          style={styles.infoRow}
        >
          <Text
            style={
              styles.infoLabel
            }
          >
            Peso:
          </Text>

          <Text
            style={
              styles.infoTextWithoutMargin
            }
          >
            {formatarNumero(
              item.peso
            )}
          </Text>
        </View>

        {item.nota === null && (
          <View
            style={
              styles.pendingBox
            }
          >
            <Text
              style={
                styles.pendingText
              }
            >
              Nota ainda não
              cadastrada.
            </Text>
          </View>
        )}

        <View
          style={
            styles.cardActions
          }
        >
          <TouchableOpacity
            style={
              styles.editButton
            }
            onPress={() =>
              abrirEdicao(item)
            }
            disabled={
              estaExcluindo
            }
          >
            <Pencil
              size={16}
              color="#2563EB"
            />

            <Text
              style={
                styles.editButtonText
              }
            >
              Editar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deleteButton,

              estaExcluindo &&
                styles.disabledButton,
            ]}
            disabled={
              estaExcluindo
            }
            onPress={() =>
              confirmarExclusao(
                item
              )
            }
          >
            {estaExcluindo ? (
              <ActivityIndicator
                size="small"
                color="#DC2626"
              />
            ) : (
              <>
                <Trash2
                  size={16}
                  color="#DC2626"
                />

                <Text
                  style={
                    styles.deleteButtonText
                  }
                >
                  Excluir
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      <View
        style={styles.header}
      >
        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            navigation.goBack()
          }
        >
          <ArrowLeft
            size={24}
            color="#0F172A"
          />
        </TouchableOpacity>

        <View
          style={
            styles.headerTextContainer
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            Avaliações
          </Text>

          <Text
            style={
              styles.subjectName
            }
          >
            {nomeDisciplina}
          </Text>
        </View>
      </View>

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
            style={
              styles.loadingText
            }
          >
            Carregando
            avaliações...
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={avaliacoes}

            keyExtractor={(
              item
            ) =>
              item.idAvaliacao.toString()
            }

            renderItem={
              renderAvaliacao
            }

            showsVerticalScrollIndicator={
              false
            }

            contentContainerStyle={[
              styles.list,

              avaliacoes.length ===
                0 &&
                styles.emptyList,
            ]}

            ListHeaderComponent={
              <View
                style={
                  styles.summarySection
                }
              >
                <Text
                  style={
                    styles.summaryTitle
                  }
                >
                  Resumo
                </Text>

                <View
                  style={
                    styles.summaryGrid
                  }
                >
                  <View
                    style={
                      styles.summaryCard
                    }
                  >
                    <Text
                      style={
                        styles.summaryLabel
                      }
                    >
                      Média atual
                    </Text>

                    <Text
                      style={
                        styles.summaryValue
                      }
                    >
                      {mediaDisciplina
                        ?.media !==
                          null &&
                      mediaDisciplina
                        ?.media !==
                        undefined
                        ? formatarNumero(
                            mediaDisciplina.media
                          )
                        : "-"}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.summaryCard
                    }
                  >
                    <Text
                      style={
                        styles.summaryLabel
                      }
                    >
                      Com nota
                    </Text>

                    <Text
                      style={
                        styles.summaryValue
                      }
                    >
                      {mediaDisciplina
                        ?.avaliacoesComNota ??
                        0}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.summaryCard
                    }
                  >
                    <Text
                      style={
                        styles.summaryLabel
                      }
                    >
                      Pendentes
                    </Text>

                    <Text
                      style={
                        styles.summaryValue
                      }
                    >
                      {mediaDisciplina
                        ?.avaliacoesPendentes ??
                        0}
                    </Text>
                  </View>
                </View>

                {mediaDisciplina
                  ?.media ===
                  null && (
                  <Text
                    style={
                      styles.mediaHelp
                    }
                  >
                    A média será
                    calculada quando
                    houver pelo menos
                    uma avaliação com
                    nota.
                  </Text>
                )}
              </View>
            }

            ListEmptyComponent={
              <View
                style={
                  styles.emptyContainer
                }
              >
                <View
                  style={
                    styles.emptyIcon
                  }
                >
                  <GraduationCap
                    size={42}
                    color="#2563EB"
                  />
                </View>

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  Nenhuma avaliação
                  cadastrada
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Cadastre provas,
                  trabalhos e outras
                  avaliações desta
                  disciplina.
                </Text>

                <TouchableOpacity
                  style={
                    styles.emptyButton
                  }
                  onPress={
                    abrirNovaAvaliacao
                  }
                >
                  <Plus
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.emptyButtonText
                    }
                  >
                    Nova Avaliação
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />

          {avaliacoes.length >
            0 && (
            <TouchableOpacity
              style={
                styles.floatingButton
              }
              onPress={
                abrirNovaAvaliacao
              }
            >
              <Plus
                size={26}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#F8FAFC",
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 18,
      backgroundColor:
        "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor:
        "#E2E8F0",
    },

    backButton: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 12,
      backgroundColor:
        "#F1F5F9",
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

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: "#64748B",
    },

    list: {
      padding: 20,
      paddingBottom: 100,
      maxWidth: 600,
      width: "100%",
      alignSelf: "center",
    },

    emptyList: {
      flexGrow: 1,
    },

    summarySection: {
      marginBottom: 20,
    },

    summaryTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: "#0F172A",
      marginBottom: 10,
    },

    summaryGrid: {
      flexDirection: "row",
      gap: 8,
    },

    summaryCard: {
      flex: 1,
      padding: 12,
      borderRadius: 12,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E2E8F0",
    },

    summaryLabel: {
      fontSize: 11,
      color: "#64748B",
      marginBottom: 5,
    },

    summaryValue: {
      fontSize: 19,
      fontWeight: "700",
      color: "#2563EB",
    },

    mediaHelp: {
      marginTop: 8,
      fontSize: 12,
      lineHeight: 18,
      color: "#64748B",
    },

    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 32,
      paddingBottom: 80,
    },

    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor:
        "#DBEAFE",
      alignItems: "center",
      justifyContent:
        "center",
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
      justifyContent:
        "center",
      gap: 8,
      marginTop: 24,
      backgroundColor:
        "#2563EB",
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
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor:
        "#E2E8F0",
    },

    cardHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
    },

    cardTitleContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems:
        "flex-start",
      marginRight: 10,
    },

    iconContainer: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent:
        "center",
      backgroundColor:
        "#EFF6FF",
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
      minWidth: 58,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor:
        "#EFF6FF",
    },

    notaPendenteContainer: {
      alignItems: "center",
      minWidth: 58,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor:
        "#F1F5F9",
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

    notaPendente: {
      marginTop: 1,
      fontSize: 18,
      fontWeight: "700",
      color: "#94A3B8",
    },

    divider: {
      height: 1,
      backgroundColor:
        "#E2E8F0",
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

    infoTextWithoutMargin: {
      fontSize: 14,
      color: "#64748B",
    },

    pendingBox: {
      marginTop: 12,
      padding: 9,
      borderRadius: 8,
      backgroundColor:
        "#FFFBEB",
      borderWidth: 1,
      borderColor:
        "#FDE68A",
    },

    pendingText: {
      fontSize: 12,
      color: "#92400E",
      fontWeight: "600",
    },

    cardActions: {
      flexDirection: "row",
      justifyContent:
        "flex-end",
      gap: 8,
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor:
        "#F1F5F9",
    },

    editButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 9,
      backgroundColor:
        "#EFF6FF",
    },

    editButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#2563EB",
    },

    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 9,
      backgroundColor:
        "#FEF2F2",
    },

    deleteButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#DC2626",
    },

    disabledButton: {
      opacity: 0.6,
    },

    floatingButton: {
      position: "absolute",
      right: 22,
      bottom: 26,
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor:
        "#2563EB",
      alignItems: "center",
      justifyContent:
        "center",

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