import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { cadastrarUsuario, loginUsuario, salvarUsuarioSessao } from "../services/authService";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    senha: "",
  });

  const [signupData, setSignupData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    if (!loginData.email.trim() || !loginData.senha.trim()) {
      showAlert("Atenção", "Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);
    try {
      const usuario = await loginUsuario({
        email: loginData.email.trim(),
        senha: loginData.senha,
      });

      await salvarUsuarioSessao(usuario);
      navigation.replace("MainTabs");
    } catch (error) {
      showAlert("Erro", error instanceof Error ? error.message : "Erro ao fazer login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupData.nome.trim() || !signupData.email.trim() || !signupData.senha.trim()) {
      showAlert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }

    if (signupData.senha !== signupData.confirmarSenha) {
      showAlert("Atenção", "As senhas não conferem.");
      return;
    }

    setIsLoading(true);
    try {
      const usuario = await cadastrarUsuario({
        nome: signupData.nome.trim(),
        email: signupData.email.trim(),
        senha: signupData.senha,
      });

      await salvarUsuarioSessao(usuario);
      navigation.replace("MainTabs");
    } catch (error) {
      showAlert("Erro", error instanceof Error ? error.message : "Erro ao cadastrar usuário.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/mascot.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>StudyMate</Text>
          <Text style={styles.appSubtitle}>Organize sua vida acadêmica</Text>
        </View>

        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => setActiveTab("login")}
            style={[styles.tabButton, activeTab === "login" && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === "login" && styles.tabTextActive]}>
              Entrar
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("signup")}
            style={[styles.tabButton, activeTab === "signup" && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === "signup" && styles.tabTextActive]}>
              Cadastrar
            </Text>
          </Pressable>
        </View>

        <Card style={styles.formCard}>
          {activeTab === "login" ? (
            <View>
              <Text style={styles.cardTitle}>Bem-vindo de volta!</Text>
              <Text style={styles.cardDescription}>
                Entre com suas credenciais para continuar
              </Text>

              <Input
                label="E-mail"
                placeholder="Digite seu e-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                value={loginData.email}
                onChangeText={(text) => setLoginData({ ...loginData, email: text })}
              />

              <Input
                label="Senha"
                placeholder="Digite sua senha"
                secureTextEntry
                value={loginData.senha}
                onChangeText={(text) => setLoginData({ ...loginData, senha: text })}
              />

              <Button
                title="Entrar"
                onPress={handleLogin}
                loading={isLoading}
                style={styles.submitButton}
              />
            </View>
          ) : (
            <View>
              <Text style={styles.cardTitle}>Criar conta</Text>
              <Text style={styles.cardDescription}>
                Cadastre-se para começar a organizar seus estudos
              </Text>

              <Input
                label="Nome completo"
                placeholder="Digite seu nome completo"
                value={signupData.nome}
                onChangeText={(text) => setSignupData({ ...signupData, nome: text })}
              />

              <Input
                label="E-mail"
                placeholder="Digite seu e-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                value={signupData.email}
                onChangeText={(text) => setSignupData({ ...signupData, email: text })}
              />

              <Input
                label="Senha"
                placeholder="Digite sua senha"
                secureTextEntry
                value={signupData.senha}
                onChangeText={(text) => setSignupData({ ...signupData, senha: text })}
              />

              <Input
                label="Confirmar senha"
                placeholder="Confirme sua senha"
                secureTextEntry
                value={signupData.confirmarSenha}
                onChangeText={(text) =>
                  setSignupData({ ...signupData, confirmarSenha: text })
                }
              />

              <Button
                title="Cadastrar"
                onPress={handleSignup}
                loading={isLoading}
                style={styles.submitButton}
              />
            </View>
          )}
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
    padding: 24,
    justifyContent: "center",
    minHeight: "100%",
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2563EB",
  },
  appSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#0F172A",
  },
  formCard: {
    padding: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 20,
  },
  submitButton: {
    marginTop: 8,
  },
});
