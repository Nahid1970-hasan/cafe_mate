import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { colors, ui } from '../utils/theme';
import { cartTotal, money } from '../utils/format';
import { removeFromCart, setQuantity } from '../redux/cartSlice';
import CartItem from '../components/CartItem';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';

export default function CartScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const items = useSelector((state) => state.cart.items);
  const total = cartTotal(items);

  return (
    <View style={ui.screen}>
      <ScreenHeader title="Cart" subtitle={items.length ? `${items.length} item${items.length === 1 ? '' : 's'}` : ''} />
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your cart is empty. Browse the menu to place an order.</Text>
          <PrimaryButton label="Browse the menu" onPress={() => navigation.navigate('HomeTab', { screen: 'Home' })} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.list}>
            {items.map((item) => (
              <CartItem
                key={item.localId}
                item={item}
                onIncrease={() => dispatch(setQuantity({ localId: item.localId, quantity: item.quantity + 1 }))}
                onDecrease={() => dispatch(setQuantity({ localId: item.localId, quantity: item.quantity - 1 }))}
                onRemove={() => dispatch(removeFromCart(item.localId))}
                onEdit={() => navigation.navigate('HomeTab', {
                  screen: 'ProductDetails',
                  params: { productId: item.product.id, cartItemId: item.localId },
                })}
              />
            ))}
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Estimated total</Text>
              <Text style={styles.total}>{money(total)}</Text>
            </View>
            <PrimaryButton label="Review order" onPress={() => navigation.navigate('Checkout')} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20 },
  empty: { padding: 24, gap: 16 },
  emptyTitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  footer: {
    padding: 20,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 12,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: colors.muted },
  total: { fontWeight: '700', fontSize: 18, color: colors.espresso },
});
