import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../utils/theme';
import { money } from '../utils/format';

export default function CustomizationOption({ label, price, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.selected]}>
      <Text style={[styles.label, selected && styles.selectedText]}>{label}</Text>
      {Number(price) > 0 ? (
        <Text style={[styles.price, selected && styles.selectedText]}>+{money(price)}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  selected: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  label: { color: colors.espresso, fontWeight: '600' },
  price: { color: colors.muted, fontSize: 12, marginTop: 2 },
  selectedText: { color: colors.white },
});
