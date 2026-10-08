import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, serif } from '../utils/theme';
import { customizationText, itemTotal, money } from '../utils/format';

export default function CartItem({ item, onIncrease, onDecrease, onEdit, onRemove }) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.name}>{item.product.name}</Text>
        <Text style={styles.price}>{money(itemTotal(item))}</Text>
      </View>
      {item.customizations.length ? (
        <Text style={styles.detail}>{customizationText(item.customizations)}</Text>
      ) : null}
      {item.specialInstruction ? <Text style={styles.note}>{item.specialInstruction}</Text> : null}
      <View style={styles.row}>
        <View style={styles.stepper}>
          <Pressable onPress={onDecrease} style={styles.step}><Text style={styles.stepText}>−</Text></Pressable>
          <Text style={styles.qty}>{item.quantity}</Text>
          <Pressable onPress={onIncrease} style={styles.step}><Text style={styles.stepText}>+</Text></Pressable>
        </View>
        <Pressable onPress={onEdit}><Text style={styles.link}>Edit</Text></Pressable>
        <Pressable onPress={onRemove}><Text style={styles.remove}>Remove</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  name: { flex: 1, fontFamily: serif, fontSize: 18, color: colors.espresso },
  price: { fontWeight: '700', color: colors.espresso },
  detail: { color: colors.muted, marginTop: 6, lineHeight: 20 },
  note: { marginTop: 4, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: 999,
  },
  step: { paddingHorizontal: 12, paddingVertical: 6 },
  stepText: { fontSize: 18, color: colors.espresso },
  qty: { minWidth: 18, textAlign: 'center', fontWeight: '700' },
  link: { color: colors.terracotta, fontWeight: '700' },
  remove: { color: colors.danger, fontWeight: '700' },
});
