import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const configurarNotificacoes = async (): Promise<boolean> => {
  if (Platform.OS === "web") {
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("lembretes", {
      name: "Lembretes acadêmicos",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const permissaoAtual = await Notifications.getPermissionsAsync();

  if (permissaoAtual.granted) {
    return true;
  }

  const novaPermissao = await Notifications.requestPermissionsAsync();

  return novaPermissao.granted;
};

export const testarNotificacao = async () => {
  const permitido = await configurarNotificacoes();

  if (!permitido) {
    throw new Error("Permissão para notificações não concedida.");
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "StudyMate",
      body: "As notificações estão funcionando!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
    },
  });
};