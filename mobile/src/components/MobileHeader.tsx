import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { ArrowLeft } from "lucide-react-native";

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  onBack,
}) => {
  return (
    <View style={styles.header}>
      {showBack && (
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color="#1E293B" />
        </Pressable>
      )}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 16,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 16,
    padding: 6,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
});
