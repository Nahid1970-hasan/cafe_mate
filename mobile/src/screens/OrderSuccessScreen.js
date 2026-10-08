import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, serif, ui } from '../utils/theme';
import { money, STATUS_LABEL } from '../utils/format';
import PrimaryButton from '../components/PrimaryButton';

export default function OrderSuccessScreen({ navigation, route }) {
  const order = route.params?.order;

  function leave(target) {
    if (target === 'order') {
      navigation.navigate('OrdersTab', {
        screen: 'OrderDetails',
        params: { orderId: order.id },
      });
    } else {
      navigation.navigate('HomeTab', { screen: 'Home' });
    }
    navigation.popToTop();
  }

  return (
    <View style={[ui.screen, styles.screen]}>
      <Text style={styles.emoji}>✓</Text>
      <Text style={styles.title}>Order placed</Text>
      <Text style={styles.number}>{order?.order_number}</Text>
      <Text style={styles.status}>Status: {STATUS_LABEL[order?.status] || 'Order Placed'}</Text>
      <Text style={styles.total}>{money(order?.total_amount)}</Text>
      <Text style={styles.copy}>The cafe has your order and every customization you selected.</Text>
      <PrimaryButton label="Track order" onPress={() => leave('order')} />
      <PrimaryButton label="Back to menu" variant="ghost" onPress={() => leave('home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  emoji: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    color: colors.white,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 36,
    lineHeight: 72,
    overflow: 'hidden',
  },
  title: { fontFamily: serif, fontSize: 36, color: colors.espresso },
  number: { fontSize: 22, fontWeight: '700', color: colors.terracotta },
  status: { color: colors.muted },
  total: { fontSize: 20, fontWeight: '700' },
  copy: { textAlign: 'center', color: colors.muted, marginBottom: 12 },
});
