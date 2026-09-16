import React, { useEffect, useState } from "react";
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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { obterUsuarioSessao, salvarUsuarioSessao } from "../services/authService";
import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    curso: "",
    semestre: "",
    matricula: "",
    instituicao: "",
  });

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    const carregar = async () => {
      const u = await obterUsuarioSessao();
      if (u) {
        setForm({
          nome: u.nome || "",
          email: u.email || "",
          curso: u.curso || "",
          semestre: u.semestre || "",
          matricula: u.matricula || "",
          instituicao: u.instituicao || "",
        });
      }
    };
    carregar();
  }, []);

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.email.trim()) {
      showAlert("Atenção", "Nome e e-mail são obrigatórios.");
      return;
    }

    const usuarioAtual = await obterUsuarioSessao();
    if (usuarioAtual) {
      const atualizado = {
        ...usuarioAtual,
        nome: form.nome.trim(),
        email: form.email.trim(),
        curso: form.curso.trim() || null,
        semestre: form.semestre.trim() || null,
        matricula: form.matricula.trim() || null,
        instituicao: form.instituicao.trim() || null,
      };
      await salvarUsuarioSessao(atualizado);
    }

    showAlert("Sucesso", "Perfil atualizado com sucesso!");
    navigation.goBack();
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <Card style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👨‍🎓</Text>
          </View>
          <Button
            title="Alterar Foto"
            variant="outline"
            size="sm"
            onPress={() => showAlert("Info", "Funcionalidade disponível em breve.")}
            style={styles.changePhotoBtn}
          />
        </Card>

        {/* Informações Pessoais */}
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

          <Text style={[styles.sectionHeader, { marginTop: 16 }]}>
            Informações Acadêmicas
          </Text>

          <Input
            label="Curso"
            placeholder="Ex: Análise e Desenv. de Sistemas"
            value={form.curso}
            onChangeText={(text) => setForm({ ...form, curso: text })}
          />

          <Input
            label="Semestre"
            placeholder="Ex: 5º Semestre"
            value={form.semestre}
            onChangeText={(text) => setForm({ ...form, semestre: text })}
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
              style={styles.cancelButton}
            />
            <Button
              title="Salvar Alterações"
              onPress={handleSubmit}
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
  changePhotoBtn: {
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
