import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { initializeDatabase } from "./src/database/database";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [databaseReady, setDatabaseReady] =
    useState(false);

  const [databaseError, setDatabaseError] =
    useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
       await initializeDatabase();

       setDatabaseReady(true);
      } catch (error) {
        console.error(
          "Erro ao inicializar banco local:",
          error
        );

        setDatabaseError(
          error instanceof Error
            ? error.message
            : String(error)
        );
      }
    }

    initialize();
  }, []);

  if (databaseError) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Text>
            Erro ao inicializar o banco local:
          </Text>

          <Text style={{ marginTop: 8 }}>
            {databaseError}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!databaseReady) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" />

          <Text style={{ marginTop: 12 }}>
            Inicializando...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

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