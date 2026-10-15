import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { configurarNotificacoes } from "./src/services/notificacaoService";
import { initializeDatabase } from "./src/database/database";
import { GamificationCelebrationProvider } from "./src/components/GamificationCelebrationProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  useEffect(() => {
    const iniciarAplicacao = async () => {
      try {
        await initializeDatabase();
      } catch (error) {
        console.error("Erro ao inicializar banco local:", error);
      }

      try {
        const permitido = await configurarNotificacoes();
        console.log("Notificações permitidas:", permitido);
      } catch (error) {
        console.error("Erro ao configurar notificações:", error);
      }
    };

    void iniciarAplicacao();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <StatusBar style="dark" />
          <GamificationCelebrationProvider>
            <RootNavigator />
          </GamificationCelebrationProvider>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}