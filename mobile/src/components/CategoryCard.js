import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../utils/theme';

export default function CategoryCard({ category, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.selected]}>
      <Text style={styles.emoji}>{category.emoji || '☕'}</Text>
      <Text style={[styles.name, selected && styles.selectedText]}>{category.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginRight: 10,
    minWidth: 92,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  selected: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  emoji: { fontSize: 22 },
  name: { marginTop: 4, fontWeight: '600', color: colors.espresso },
  selectedText: { color: colors.white },
});
