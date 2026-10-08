import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, ui } from '../utils/theme';
import { formatWhen, money } from '../utils/format';
import { fetchOrder } from '../redux/ordersSlice';
import OrderStatus from '../components/OrderStatus';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';

export default function OrderDetailsScreen({ navigation, route }) {
  const { orderId } = route.params;
  const dispatch = useDispatch();
  const { current, loading, error } = useSelector((state) => state.orders);
  const order = current && current.id === orderId ? current : null;

  const load = useCallback(() => {
    dispatch(fetchOrder(orderId));
  }, [dispatch, orderId]);

  useFocusEffect(useCallback(() => {
    load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, [load]));

  return (
    <View style={ui.screen}>
      <ScreenHeader title={order?.order_number || 'Order'} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.terracotta} />}
      >
        {!order && loading ? <Text style={ui.muted}>Loading...</Text> : null}
        {error && !order ? (
          <View style={styles.gap}>
            <Text style={ui.error}>{error}</Text>
            <PrimaryButton label="Try again" onPress={load} />
          </View>
        ) : null}
        {order ? (
          <>
            <View style={styles.card}>
              <OrderStatus status={order.status} />
              <Text style={styles.when}>{formatWhen(order.created_at)}</Text>
            </View>
            {order.items.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.name}>{item.quantity} × {item.product_name}</Text>
                  <Text style={styles.price}>{money(item.total_price)}</Text>
                </View>
                {item.customizations.map((option) => (
                  <Text key={option.id} style={styles.detail}>
                    {option.option_name}: {option.option_value}
                    {Number(option.extra_price) > 0 ? ` (+${money(option.extra_price)})` : ''}
                  </Text>
                ))}
                {item.special_instruction ? <Text style={styles.detail}>Note: {item.special_instruction}</Text> : null}
              </View>
            ))}
            {order.special_instruction ? (
              <View style={styles.card}>
                <Text style={styles.name}>Order note</Text>
                <Text style={styles.detail}>{order.special_instruction}</Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total}>{money(order.total_amount)}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 12 },
  gap: { gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 14 },
  when: { color: colors.muted, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  name: { flex: 1, fontWeight: '700', color: colors.espresso },
  price: { fontWeight: '700' },
  detail: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  totalLabel: { color: colors.muted, fontSize: 16 },
  total: { fontWeight: '700', fontSize: 20, color: colors.espresso },
});
