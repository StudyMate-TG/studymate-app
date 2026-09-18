import React from "react";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from "react-native";

import type {
  StyleProp,
  TextInputProps,
  ViewStyle,
} from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  leftIcon,
  style,
  multiline,
  ...rest
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputWrapper,
          multiline && styles.inputWrapperMultiline,
          error ? styles.inputError : null,
        ]}
      >
        {leftIcon ? (
          <View
            style={[
              styles.iconContainer,
              multiline && styles.iconContainerMultiline,
            ]}
          >
            {leftIcon}
          </View>
        ) : null}

        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            style,
          ]}
          placeholderTextColor="#94A3B8"
          multiline={multiline}
          {...rest}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 6,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
  },

  inputWrapperMultiline: {
    alignItems: "flex-start",
  },

  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },

  iconContainer: {
    marginRight: 8,
  },

  iconContainerMultiline: {
    marginTop: 12,
  },

  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0F172A",
  },

  inputMultiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
});