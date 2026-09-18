import React, { useEffect, useState } from "react";

import {
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { RootStackParamList, MainTabParamList } from "../types";

import { obterUsuarioSessao } from "../services/authService";

import { LoginScreen } from "../screens/LoginScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { SubjectsScreen } from "../screens/SubjectsScreen";
import { NewSubjectScreen } from "../screens/NewSubjectScreen";
import { EditSubjectScreen } from "../screens/EditSubjectScreen";
import { CalendarScreen } from "../screens/CalendarScreen";
import { NewTaskScreen } from "../screens/NewTaskScreen";
import { NewAttendanceScreen } from "../screens/NewAttendanceScreen";
import { AchievementsScreen } from "../screens/AchievementsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { EditProfileScreen } from "../screens/EditProfileScreen";

import {
  Home,
  BookOpen,
  Calendar as CalendarIcon,
  Trophy,
  User,
} from "lucide-react-native";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#64748B",
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "Início",
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="SubjectsTab"
        component={SubjectsScreen}
        options={{
          tabBarLabel: "Disciplinas",
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{
          tabBarLabel: "Agenda",
          tabBarIcon: ({ color, size }) => (
            <CalendarIcon color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="AchievementsTab"
        component={AchievementsScreen}
        options={{
          tabBarLabel: "Conquistas",
          tabBarIcon: ({ color, size }) => (
            <Trophy color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator: React.FC = () => {
  const [initialRouteName, setInitialRouteName] =
    useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    const verificarSessao = async () => {
      const usuario = await obterUsuarioSessao();

      if (usuario) {
        setInitialRouteName("MainTabs");
      } else {
        setInitialRouteName("Login");
      }
    };

    verificarSessao();
  }, []);

  if (!initialRouteName) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      <Stack.Screen name="NewSubject" component={NewSubjectScreen} />
      <Stack.Screen name="EditSubject" component={EditSubjectScreen} />

      <Stack.Screen name="NewTask" component={NewTaskScreen} />
      <Stack.Screen name="NewAttendance" component={NewAttendanceScreen} />

      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
});