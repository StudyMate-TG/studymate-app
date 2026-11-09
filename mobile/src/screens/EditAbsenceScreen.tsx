import React, {
  useState,
} from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import type {
  RootStackScreenProps,
} from "../types";

import {
  atualizarFalta,
} from "../services/faltaService";

import {
  obterUsuarioSessao,
} from "../services/authService";

import {
  converterDataParaApi,
  formatarDataEstudo,
  formatarEntradaData,
} from "../utils/dataEstudoUtils";

import {
  MobileHeader,
} from "../components/MobileHeader";

import {
  Card,
} from "../components/Card";

import {
  Input,
} from "../components/Input";

import {
  Button,
} from "../components/Button";

type Props =
  RootStackScreenProps<"EditAbsence">;

export const EditAbsenceScreen:
  React.FC<Props> = ({
    navigation,
    route,
  }) => {
    const {
      idFalta,
      idDisciplina,
      nomeDisciplina,
      dataFalta,
      quantidadeAulas:
        quantidadeAulasInicial,
    } = route.params;

    const [
      data,
      setData,
    ] = useState(
      formatarDataEstudo(
        dataFalta.substring(0, 10)
      )
    );

    const [
      quantidadeAulas,
      setQuantidadeAulas,
    ] = useState(
      String(
        quantidadeAulasInicial
      )
    );

    const [
      salvando,
      setSalvando,
    ] = useState(false);

    const salvar = async () => {
      if (salvando) {
        return;
      }

      const dataApi =
        converterDataParaApi(data);

      if (!dataApi) {
        Alert.alert(
          "Atenção",
          "Informe uma data válida no formato DD/MM/AAAA."
        );
        return;
      }

      const quantidade =
        Number(quantidadeAulas);

      if (
        Number.isNaN(quantidade) ||
        !Number.isInteger(quantidade) ||
        quantidade <= 0
      ) {
        Alert.alert(
          "Atenção",
          "Informe uma quantidade válida de aulas."
        );
        return;
      }

      try {
        setSalvando(true);

        const usuario =
          await obterUsuarioSessao();

        if (!usuario?.idUsuario) {
          navigation.replace(
            "Login"
          );
          return;
        }

        await atualizarFalta(
          idFalta,
          usuario.idUsuario,
          {
            idDisciplina,
            dataFalta: dataApi,
            quantidadeAulas:
              quantidade,
          }
        );

        navigation.goBack();
      } catch (error) {
        Alert.alert(
          "Erro",
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a falta."
        );
      } finally {
        setSalvando(false);
      }
    };

    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <KeyboardAvoidingView
          style={
            styles.container
          }
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <MobileHeader
            title="Editar falta"
            showBack
            onBack={() =>
              navigation.goBack()
            }
          />

          <ScrollView
            contentContainerStyle={
              styles.content
            }
            keyboardShouldPersistTaps="handled"
          >
            <Card
              style={
                styles.card
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
                  styles.subjectName
                }
              >
                {nomeDisciplina}
              </Text>

              <View
                style={
                  styles.field
                }
              >
                <Input
                  label="Data da falta"
                  value={data}
                  onChangeText={(
                    valor
                  ) =>
                    setData(
                      formatarEntradaData(
                        valor
                      )
                    )
                  }
                  placeholder="DD/MM/AAAA"
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>

              <View
                style={
                  styles.field
                }
              >
                <Input
                  label="Quantidade de aulas perdidas"
                  value={
                    quantidadeAulas
                  }
                  onChangeText={
                    setQuantidadeAulas
                  }
                  keyboardType="numeric"
                  placeholder="Ex: 2"
                />
              </View>

              <Button
                title="Salvar alterações"
                onPress={salvar}
                loading={salvando}
                disabled={salvando}
              />
            </Card>
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

    content: {
      padding: 16,
      paddingBottom: 40,
      maxWidth: 600,
      width: "100%",
      alignSelf: "center",
    },

    card: {
      padding: 20,
    },

    subjectLabel: {
      fontSize: 12,
      color: "#64748B",
    },

    subjectName: {
      marginTop: 3,
      marginBottom: 22,
      fontSize: 18,
      fontWeight: "700",
      color: "#0F172A",
    },

    field: {
      marginBottom: 16,
    },
  });