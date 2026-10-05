import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

import {
  ArrowLeft,
  Save,
  GraduationCap,
} from "lucide-react-native";

import { RootStackScreenProps } from "../types";

import { obterUsuarioSessao } from "../services/authService";

import {
  cadastrarAvaliacao,
} from "../services/avaliacaoService";

type Props =
  RootStackScreenProps<"NewEvaluation">;

export const NewEvaluationScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const {
    idDisciplina,
    nomeDisciplina,
  } = route.params;

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [dataAvaliacao, setDataAvaliacao] =
    useState("");
  const [peso, setPeso] = useState("");
  const [nota, setNota] = useState("");

  const [salvando, setSalvando] =
    useState(false);

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
    } else {
      Alert.alert(
        titulo,
        mensagem
      );
    }
  };

  const validarData = (
    data: string
  ): boolean => {
    const regex =
      /^\d{2}\/\d{2}\/\d{4}$/;

    if (!regex.test(data)) {
      return false;
    }

    const [dia, mes, ano] =
      data
        .split("/")
        .map(Number);

    const dataObj =
      new Date(
        ano,
        mes - 1,
        dia
      );

    return (
      dataObj.getFullYear() === ano &&
      dataObj.getMonth() ===
        mes - 1 &&
      dataObj.getDate() === dia
    );
  };

  const possuiNoMaximoDuasCasas =
    (
      valor: string
    ): boolean => {
      const normalizado =
        valor.replace(",", ".");

      return /^\d+(\.\d{1,2})?$/.test(
        normalizado
      );
    };

  const converterDataParaApi = (
    data: string
  ) => {
    const [dia, mes, ano] =
      data.split("/");

    return `${ano}-${mes}-${dia}`;
  };

  const salvarAvaliacao =
    async () => {
      if (salvando) {
        return;
      }

      const nomeLimpo =
        nome.trim();

      const tipoLimpo =
        tipo.trim();

      if (!nomeLimpo) {
        mostrarAlerta(
          "Atenção",
          "Informe o nome da avaliação."
        );
        return;
      }

      if (
        nomeLimpo.length > 100
      ) {
        mostrarAlerta(
          "Atenção",
          "O nome da avaliação deve possuir no máximo 100 caracteres."
        );
        return;
      }

      if (!tipoLimpo) {
        mostrarAlerta(
          "Atenção",
          "Informe o tipo da avaliação."
        );
        return;
      }

      if (
        tipoLimpo.length > 20
      ) {
        mostrarAlerta(
          "Atenção",
          "O tipo deve possuir no máximo 20 caracteres."
        );
        return;
      }

      if (
        !dataAvaliacao.trim()
      ) {
        mostrarAlerta(
          "Atenção",
          "Informe a data da avaliação."
        );
        return;
      }

      if (
        !validarData(
          dataAvaliacao
        )
      ) {
        mostrarAlerta(
          "Atenção",
          "Informe uma data válida no formato DD/MM/AAAA."
        );
        return;
      }

      if (!peso.trim()) {
        mostrarAlerta(
          "Atenção",
          "Informe o peso da avaliação."
        );
        return;
      }

      if (
        !possuiNoMaximoDuasCasas(
          peso
        )
      ) {
        mostrarAlerta(
          "Atenção",
          "O peso deve possuir no máximo duas casas decimais."
        );
        return;
      }

      const pesoNumero =
        Number(
          peso.replace(",", ".")
        );

      if (
        Number.isNaN(
          pesoNumero
        ) ||
        pesoNumero <= 0 ||
        pesoNumero > 99.99
      ) {
        mostrarAlerta(
          "Atenção",
          "O peso deve ser maior que zero e no máximo 99,99."
        );
        return;
      }

      let notaNumero:
        number | null = null;

      if (nota.trim()) {
        if (
          !possuiNoMaximoDuasCasas(
            nota
          )
        ) {
          mostrarAlerta(
            "Atenção",
            "A nota deve possuir no máximo duas casas decimais."
          );
          return;
        }

        notaNumero =
          Number(
            nota.replace(
              ",",
              "."
            )
          );

        if (
          Number.isNaN(
            notaNumero
          ) ||
          notaNumero < 0 ||
          notaNumero > 10
        ) {
          mostrarAlerta(
            "Atenção",
            "A nota deve estar entre 0 e 10."
          );
          return;
        }
      }

      try {
        setSalvando(true);

        const usuario =
          await obterUsuarioSessao();

        if (
          !usuario?.idUsuario
        ) {
          throw new Error(
            "Usuário não encontrado. Faça login novamente."
          );
        }

        const dataApi =
          converterDataParaApi(
            dataAvaliacao
          );

        await cadastrarAvaliacao(
          usuario.idUsuario,
          {
            idDisciplina,
            nome: nomeLimpo,
            tipo: tipoLimpo,
            nota: notaNumero,
            peso: pesoNumero,
            dataAvaliacao:
              dataApi,
          }
        );

        if (
          Platform.OS ===
            "web" &&
          typeof window !==
            "undefined"
        ) {
          window.alert(
            "Sucesso: Avaliação cadastrada com sucesso."
          );

          navigation.goBack();
          return;
        }

        Alert.alert(
          "Sucesso",
          "Avaliação cadastrada com sucesso.",
          [
            {
              text: "OK",
              onPress: () =>
                navigation.goBack(),
            },
          ]
        );
      } catch (error) {
        mostrarAlerta(
          "Erro",
          error instanceof Error
            ? error.message
            : "Erro ao cadastrar avaliação."
        );
      } finally {
        setSalvando(false);
      }
    };

  return (
    <SafeAreaView
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={
          styles.keyboardContainer
        }
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
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
            disabled={salvando}
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
              Nova Avaliação
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

        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={
              styles.subjectCard
            }
          >
            <View
              style={
                styles.subjectIcon
              }
            >
              <GraduationCap
                size={24}
                color="#2563EB"
              />
            </View>

            <View
              style={
                styles.subjectInfo
              }
            >
              <Text
                style={
                  styles.subjectLabel
                }
              >
                Disciplina
              </Text>

              <Text
                style={
                  styles.subjectValue
                }
              >
                {nomeDisciplina}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.formGroup
            }
          >
            <Text
              style={styles.label}
            >
              Nome da avaliação *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex.: Prova 1"
              placeholderTextColor="#94A3B8"
              value={nome}
              onChangeText={
                setNome
              }
              maxLength={100}
              editable={!salvando}
            />
          </View>

          <View
            style={
              styles.formGroup
            }
          >
            <Text
              style={styles.label}
            >
              Tipo *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex.: PROVA, TRABALHO, SEMINARIO"
              placeholderTextColor="#94A3B8"
              value={tipo}
              onChangeText={
                setTipo
              }
              maxLength={20}
              editable={!salvando}
              autoCapitalize="characters"
            />

            <Text
              style={
                styles.fieldHelp
              }
            >
              Você pode informar qualquer
              tipo de avaliação.
            </Text>
          </View>

          <View
            style={
              styles.formGroup
            }
          >
            <Text
              style={styles.label}
            >
              Data da avaliação *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#94A3B8"
              value={
                dataAvaliacao
              }
              onChangeText={
                setDataAvaliacao
              }
              keyboardType="numeric"
              maxLength={10}
              editable={!salvando}
            />
          </View>

          <View
            style={styles.row}
          >
            <View
              style={
                styles.halfField
              }
            >
              <Text
                style={styles.label}
              >
                Peso *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ex.: 2"
                placeholderTextColor="#94A3B8"
                value={peso}
                onChangeText={
                  setPeso
                }
                keyboardType="decimal-pad"
                editable={!salvando}
              />
            </View>

            <View
              style={
                styles.halfField
              }
            >
              <Text
                style={styles.label}
              >
                Nota
              </Text>

              <TextInput
                style={styles.input}
                placeholder="0 a 10"
                placeholderTextColor="#94A3B8"
                value={nota}
                onChangeText={
                  setNota
                }
                keyboardType="decimal-pad"
                editable={!salvando}
              />
            </View>
          </View>

          <Text
            style={
              styles.helperText
            }
          >
            A nota é opcional. Você
            pode cadastrar a avaliação
            agora e informar a nota
            posteriormente.
          </Text>

          <TouchableOpacity
            style={[
              styles.saveButton,
              salvando &&
                styles.buttonDisabled,
            ]}
            onPress={
              salvarAvaliacao
            }
            disabled={salvando}
          >
            {salvando ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Salvando...
                </Text>
              </>
            ) : (
              <>
                <Save
                  size={20}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Salvar Avaliação
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.cancelButton
            }
            onPress={() =>
              navigation.goBack()
            }
            disabled={salvando}
          >
            <Text
              style={
                styles.cancelButtonText
              }
            >
              Cancelar
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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

    keyboardContainer: {
      flex: 1,
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

    content: {
      padding: 20,
      paddingBottom: 40,
      maxWidth: 600,
      width: "100%",
      alignSelf: "center",
    },

    subjectCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      marginBottom: 24,
      borderRadius: 14,
      backgroundColor:
        "#EFF6FF",
      borderWidth: 1,
      borderColor: "#BFDBFE",
    },

    subjectIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent:
        "center",
      backgroundColor:
        "#DBEAFE",
    },

    subjectInfo: {
      flex: 1,
      marginLeft: 14,
    },

    subjectLabel: {
      fontSize: 12,
      color: "#64748B",
    },

    subjectValue: {
      marginTop: 2,
      fontSize: 16,
      fontWeight: "700",
      color: "#0F172A",
    },

    formGroup: {
      marginBottom: 20,
    },

    label: {
      marginBottom: 8,
      fontSize: 14,
      fontWeight: "600",
      color: "#334155",
    },

    input: {
      height: 50,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: "#CBD5E1",
      borderRadius: 12,
      backgroundColor:
        "#FFFFFF",
      fontSize: 15,
      color: "#0F172A",
    },

    fieldHelp: {
      marginTop: 6,
      fontSize: 12,
      color: "#64748B",
    },

    row: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 6,
    },

    halfField: {
      flex: 1,
    },

    helperText: {
      marginTop: 4,
      marginBottom: 28,
      fontSize: 13,
      lineHeight: 19,
      color: "#64748B",
    },

    saveButton: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
      borderRadius: 12,
      backgroundColor:
        "#2563EB",
    },

    buttonDisabled: {
      opacity: 0.65,
    },

    saveButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
    },

    cancelButton: {
      height: 50,
      alignItems: "center",
      justifyContent:
        "center",
      marginTop: 10,
    },

    cancelButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: "#64748B",
    },
  });