import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { configurarNotificacoes } from "./src/services/notificacaoService";

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
    const iniciarNotificacoes = async () => {
      try {
        const permitido = await configurarNotificacoes();

        console.log("Notificações permitidas:", permitido);
      } catch (error) {
        console.error("Erro ao configurar notificações:", error);
      }
    };

    iniciarNotificacoes();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}