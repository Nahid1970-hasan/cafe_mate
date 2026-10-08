import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/theme';
import { STATUS_LABEL } from '../utils/format';

const STEPS = ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'];

export default function OrderStatus({ status }) {
  const current = Math.max(0, STEPS.indexOf(status));
  return (
    <View>
      <Text style={styles.label}>{STATUS_LABEL[status] || status}</Text>
      <View style={styles.row}>
        {STEPS.map((step, index) => (
          <View key={step} style={styles.step}>
            <View style={[styles.dot, index <= current && styles.dotOn]} />
            {index < STEPS.length - 1 ? <View style={[styles.line, index < current && styles.lineOn]} /> : null}
          </View>
        ))}
      </View>
      <View style={styles.names}>
        {STEPS.map((step) => (
          <Text key={step} style={[styles.name, step === status && styles.nameOn]}>
            {step === 'NEW' ? 'Placed' : step === 'COMPLETED' ? 'Done' : STATUS_LABEL[step].split(' ')[0]}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '700', color: colors.espresso, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  step: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.line,
  },
  dotOn: { backgroundColor: colors.terracotta },
  line: { flex: 1, height: 2, backgroundColor: colors.line },
  lineOn: { backgroundColor: colors.terracotta },
  names: { flexDirection: 'row', marginTop: 6 },
  name: { flex: 1, fontSize: 10, color: colors.muted },
  nameOn: { color: colors.espresso, fontWeight: '700' },
});
