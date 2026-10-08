import React, { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, ui } from '../utils/theme';
import { formatWhen, money, STATUS_LABEL } from '../utils/format';
import { fetchOrders } from '../redux/ordersSlice';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';

export default function OrderHistoryScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { list, loading, error } = useSelector((state) => state.orders);

  useFocusEffect(useCallback(() => {
    if (user) dispatch(fetchOrders());
  }, [dispatch, user]));

  return (
    <View style={ui.screen}>
      <ScreenHeader title="My orders" />
      {!user ? (
        <View style={styles.empty}>
          <Text style={ui.muted}>Sign in to see your orders.</Text>
          <PrimaryButton label="Sign in" onPress={() => navigation.navigate('Login')} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchOrders())} tintColor={colors.terracotta} />}
        >
          {loading && !list.length ? <Text style={ui.muted}>Loading...</Text> : null}
          {error ? (
            <View style={styles.empty}>
              <Text style={ui.error}>{error}</Text>
              <PrimaryButton label="Try again" onPress={() => dispatch(fetchOrders())} />
            </View>
          ) : null}
          {!loading && !error && !list.length ? <Text style={styles.emptyText}>You have no orders yet.</Text> : null}
          {list.map((order) => (
            <Pressable key={order.id} style={styles.card} onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}>
              <View style={styles.row}>
                <Text style={styles.number}>{order.order_number}</Text>
                <Text style={styles.price}>{money(order.total_amount)}</Text>
              </View>
              <Text style={styles.status}>{STATUS_LABEL[order.status] || order.status}</Text>
              <Text style={ui.muted}>{formatWhen(order.created_at)} · {order.items.length} item{order.items.length === 1 ? '' : 's'}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20 },
  empty: { padding: 20, gap: 12 },
  emptyText: { color: colors.muted, fontSize: 16 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  number: { fontWeight: '700', color: colors.espresso },
  price: { fontWeight: '700' },
  status: { color: colors.terracotta, marginVertical: 4, fontWeight: '600' },
});
