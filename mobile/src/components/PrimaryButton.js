import React from 'react';
import { Pressable, Text } from 'react-native';
import { ui } from '../utils/theme';

export default function PrimaryButton({ label, onPress, disabled, variant }) {
  const ghost = variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[ghost ? ui.ghost : ui.primary, disabled && { opacity: 0.55 }]}
    >
      <Text style={ghost ? ui.ghostText : ui.primaryText}>{label}</Text>
    </Pressable>
  );
}
