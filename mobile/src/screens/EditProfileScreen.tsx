import React, { useEffect, useState } from "react";
import { atualizarUsuario } from "../services/usuarioService";

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types";

import {
  obterUsuarioSessao,
  salvarUsuarioSessao,
} from "../services/authService";

import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export const EditProfileScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    curso: "",
    matricula: "",
    instituicao: "",
  });

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    const carregarUsuario = async () => {
      const usuario = await obterUsuarioSessao();

      if (!usuario) {
        showAlert("Atenção", "Nenhum usuário logado foi encontrado.");
        navigation.goBack();
        return;
      }

      setForm({
        nome: usuario.nome || "",
        email: usuario.email || "",
        curso: usuario.curso || "",
        matricula: usuario.matricula || "",
        instituicao: usuario.instituicao || "",
      });
    };

    carregarUsuario();
  }, [navigation]);

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.email.trim()) {
      showAlert("Atenção", "Nome e e-mail são obrigatórios.");
      return;
    }

    if (!form.email.includes("@")) {
      showAlert("Atenção", "Informe um e-mail válido.");
      return;
    }

    setIsLoading(true);

    try {
      const usuarioAtual = await obterUsuarioSessao();

      if (!usuarioAtual) {
        showAlert("Erro", "Não foi possível encontrar o usuário logado.");
        return;
      }

      const atualizado = await atualizarUsuario(usuarioAtual.idUsuario, {
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        curso: form.curso.trim() || null,
        matricula: form.matricula.trim() || null,
        instituicao: form.instituicao.trim() || null,
      });

      await salvarUsuarioSessao(atualizado);

      showAlert("Sucesso", "Perfil atualizado com sucesso!");
      navigation.goBack();
    } catch (error) {
      showAlert(
        "Erro",
        error instanceof Error ? error.message : "Erro ao atualizar perfil."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <MobileHeader
        title="Editar Perfil"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👨‍🎓</Text>
          </View>

          <Button
            title="Alterar Foto"
            variant="outline"
            size="sm"
            onPress={() =>
              showAlert("Info", "Funcionalidade disponível em breve.")
            }
            style={styles.changePhotoButton}
          />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionHeader}>Informações Pessoais</Text>

          <Input
            label="Nome Completo"
            placeholder="Digite seu nome"
            value={form.nome}
            onChangeText={(text) => setForm({ ...form, nome: text })}
          />

          <Input
            label="E-mail"
            placeholder="Digite seu e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
          />

          <Text style={[styles.sectionHeader, styles.academicHeader]}>
            Informações Acadêmicas
          </Text>

          <Input
            label="Curso"
            placeholder="Ex: Análise e Desenv. de Sistemas"
            value={form.curso}
            onChangeText={(text) => setForm({ ...form, curso: text })}
          />

          <Input
            label="Matrícula"
            placeholder="Digite seu RA ou matrícula"
            value={form.matricula}
            onChangeText={(text) => setForm({ ...form, matricula: text })}
          />

          <Input
            label="Instituição de Ensino"
            placeholder="Ex: FATEC"
            value={form.instituicao}
            onChangeText={(text) => setForm({ ...form, instituicao: text })}
          />

          <View style={styles.actionButtons}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => navigation.goBack()}
              disabled={isLoading}
              style={styles.cancelButton}
            />

            <Button
              title="Salvar Alterações"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={styles.saveButton}
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    padding: 16,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },

  avatarCard: {
    alignItems: "center",
    padding: 20,
    marginBottom: 16,
  },

  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  avatarEmoji: {
    fontSize: 40,
  },

  changePhotoButton: {
    paddingHorizontal: 16,
  },

  formCard: {
    padding: 20,
  },

  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },

  academicHeader: {
    marginTop: 16,
  },

  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  cancelButton: {
    flex: 1,
  },

  saveButton: {
    flex: 1,
  },
});