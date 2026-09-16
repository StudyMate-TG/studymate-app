import { Platform } from "react-native";

// Permite configurar via variável de ambiente EXPO_PUBLIC_API_URL se definida.
// No navegador (modo web do Expo / Docker), usa o hostname atual para evitar problemas de rede.
// Em emulador Android, '10.0.2.2' acessa o localhost da máquina host.
// Em dispositivo físico com Expo Go, configure EXPO_PUBLIC_API_URL=http://<IP_DA_MAQUINA>:8081/api
export const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location?.hostname) {
      return `http://${window.location.hostname}:8081/api`;
    }
    return "http://localhost:8081/api";
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8081/api";
  }

  return "http://localhost:8081/api";
};

export const API_BASE_URL = getApiBaseUrl();
