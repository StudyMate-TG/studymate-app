import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


import { navigationRef, RootNavigator } from "./src/navigation/RootNavigator";
import { cancelarTodosLembretesLocais, configurarNotificacoes } from "./src/services/notificacaoService";
import { initializeDatabase } from "./src/database/database";
import { GamificationCelebrationProvider } from "./src/components/GamificationCelebrationProvider";

import { onSessionEnded } from "./src/services/apiClient";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

onSessionEnded(() => { queryClient.clear(); });

export default function App() {
  useEffect(() => {
    const iniciarAplicacao = async () => {
      // JWTs are memory-only: persisted device reminders belong to the previous session.
      await cancelarTodosLembretesLocais().catch((error) => console.warn("Não foi possível limpar lembretes da sessão anterior.", error));
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
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="dark" />
          <GamificationCelebrationProvider>
            <RootNavigator />
          </GamificationCelebrationProvider>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
