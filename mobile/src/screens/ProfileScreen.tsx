import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, UsuarioResponse } from "../types";
import { obterUsuarioSessao, encerrarSessao } from "../services/authService";
import { MobileHeader } from "../components/MobileHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import {
  User,
  Bell,
  Moon,
  LogOut,
  ChevronRight,
  Settings,
  HelpCircle,
} from "lucide-react-native";

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const [usuario, setUsuario] = useState<UsuarioResponse | null>(null);

  useEffect(() => {
    const carregar = async () => {
      const u = await obterUsuarioSessao();
      setUsuario(u);
    };
    if (isFocused) {
      carregar();
    }
  }, [isFocused]);

  const handleLogout = async () => {
    const logout = async () => {
      await encerrarSessao();
      navigation.replace("Login");
    };

    if (Platform.OS === "web") {
      if (window.confirm("Deseja realmente sair da conta?")) {
        logout();
      }
    } else {
      Alert.alert("Confirmação", "Deseja realmente sair da sua conta?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: logout },
      ]);
    }
  };

  const menuItems = [
    {
      icon: <User size={20} color="#64748B" />,
      label: "Editar Perfil",
      onPress: () => navigation.navigate("EditProfile"),
    },
    {
      icon: <Bell size={20} color="#64748B" />,
      label: "Notificações",
      onPress: () => {},
    },
    {
      icon: <Moon size={20} color="#64748B" />,
      label: "Modo Escuro",
      onPress: () => {},
    },
    {
      icon: <Settings size={20} color="#64748B" />,
      label: "Configurações",
      onPress: () => {},
    },
    {
      icon: <HelpCircle size={20} color="#64748B" />,
      label: "Ajuda e Suporte",
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      <MobileHeader title="Perfil" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Card Header do Perfil */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👨‍🎓</Text>
          </View>
          <Text style={styles.userName}>{usuario?.nome || "Estudante"}</Text>
          <Text style={styles.userEmail}>
            {usuario?.email || "email@estudante.com"}
          </Text>
          <Button
            title="Editar Perfil"
            onPress={() => navigation.navigate("EditProfile")}
            style={styles.editButton}
          />
        </Card>

        {/* Informações Acadêmicas */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Informações Acadêmicas</Text>
          <Text style={styles.infoSubtitle}>
            {usuario?.curso
              ? `Curso: ${usuario.curso}`
              : "Curso, matrícula e semestre serão sincronizados com o backend."}
          </Text>
        </Card>

        {/* Resumo Acadêmico */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Resumo acadêmico</Text>
          <Text style={styles.infoSubtitle}>
            Média geral, presença e tarefas concluídas serão exibidas quando houver dados cadastrados.
          </Text>
        </Card>

        {/* Itens de Configuração */}
        <Card style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              onPress={item.onPress}
              style={[
                styles.menuRow,
                index < menuItems.length - 1 && styles.menuRowBorder,
              ]}
            >
              <View style={styles.menuLeft}>
                {item.icon}
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </Pressable>
          ))}
        </Card>

        {/* Botão Sair */}
        <Button
          title="Sair da Conta"
          variant="destructive"
          icon={<LogOut size={18} color="#FFFFFF" />}
          onPress={handleLogout}
          style={styles.logoutButton}
        />

        <Text style={styles.versionText}>StudyMate Mobile v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  profileCard: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 42,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  userEmail: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 16,
  },
  editButton: {
    width: "100%",
    maxWidth: 200,
  },
  infoCard: {
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  menuCard: {
    padding: 4,
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuLabel: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "500",
    marginLeft: 12,
  },
  logoutButton: {
    marginBottom: 16,
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: "#94A3B8",
  },
});
