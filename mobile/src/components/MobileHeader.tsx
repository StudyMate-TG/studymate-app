
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";

import { ArrowLeft, Bell } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotifications?: boolean;
  onNotificationsPress?: () => void;
  unreadCount?: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  onBack,
  showNotifications = false,
  onNotificationsPress,
  unreadCount = 0,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        {showBack && (
          <Pressable
            onPress={onBack}
            disabled={!onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <ArrowLeft size={22} color="#1E293B" />
          </Pressable>
        )}

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {showNotifications && (
          <Pressable
            onPress={onNotificationsPress}
            disabled={!onNotificationsPress}
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0
                ? `${unreadCount} notificações não lidas. Abrir central de notificações.`
                : "Abrir central de notificações"
            }
            style={({ pressed }) => [
              styles.notificationButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={styles.bellContainer}>
              <Bell size={25} color="#303247" strokeWidth={2.5} />

              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    +{unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  headerContent: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 56,
    position: "relative",
  },

  backButton: {
    position: "absolute",
    left: 16,
    padding: 6,
    borderRadius: 8,
  },

  notificationButton: {
    position: "absolute",
    right: 16,
    padding: 6,
    borderRadius: 8,
  },

  bellContainer: {
    position: "relative",
    padding: 3,
  },

  notificationBadge: {
    position: "absolute",
    top: -10,
    right: -15,
    minWidth: 30,
    height: 30,
    paddingHorizontal: 5,
    borderRadius: 15,
    backgroundColor: "#E91E63",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  buttonPressed: {
    opacity: 0.7,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
});
