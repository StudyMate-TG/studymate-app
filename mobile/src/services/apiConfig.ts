import { Platform } from "react-native";

export const getApiBaseUrl = (): string => {
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