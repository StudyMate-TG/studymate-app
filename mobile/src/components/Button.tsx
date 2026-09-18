import React from "react";

import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import type {
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "default",
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const getContainerStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.secondaryContainer;
      case "outline":
        return styles.outlineContainer;
      case "destructive":
        return styles.destructiveContainer;
      case "ghost":
        return styles.ghostContainer;
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.secondaryText;
      case "outline":
        return styles.outlineText;
      case "destructive":
        return styles.destructiveText;
      case "ghost":
        return styles.ghostText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case "sm":
        return styles.smContainer;
      case "lg":
        return styles.lgContainer;
      default:
        return styles.defaultContainer;
    }
  };

  const getLoadingColor = () => {
    if (variant === "primary" || variant === "destructive") {
      return "#FFFFFF";
    }

    return "#2563EB";
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      style={({ pressed }) => [
        styles.baseContainer,
        getContainerStyle(),
        getSizeStyle(),
        isDisabled && styles.disabledContainer,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getLoadingColor()} />
      ) : (
        <>
          {icon}

          <Text
            style={[
              styles.baseText,
              getTextStyle(),
              size === "sm" && styles.smText,
              size === "lg" && styles.lgText,
              icon ? styles.textWithIcon : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },

  baseText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  textWithIcon: {
    marginLeft: 8,
  },

  defaultContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  smContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  lgContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
  },

  smText: {
    fontSize: 13,
  },

  lgText: {
    fontSize: 16,
  },

  primaryContainer: {
    backgroundColor: "#2563EB",
  },

  primaryText: {
    color: "#FFFFFF",
  },

  secondaryContainer: {
    backgroundColor: "#F1F5F9",
  },

  secondaryText: {
    color: "#0F172A",
  },

  outlineContainer: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  outlineText: {
    color: "#334155",
  },

  destructiveContainer: {
    backgroundColor: "#EF4444",
  },

  destructiveText: {
    color: "#FFFFFF",
  },

  ghostContainer: {
    backgroundColor: "transparent",
  },

  ghostText: {
    color: "#334155",
  },

  disabledContainer: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.8,
  },
});