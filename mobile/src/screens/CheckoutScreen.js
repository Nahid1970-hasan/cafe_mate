import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { colors, ui } from '../utils/theme';
import { cartTotal, customizationText, itemTotal, money } from '../utils/format';
import { clearCart } from '../redux/cartSlice';
import { clearPlaceError, placeOrder } from '../redux/ordersSlice';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';

export default function CheckoutScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const items = useSelector((state) => state.cart.items);
  const user = useSelector((state) => state.auth.user);
  const { placing, placeError } = useSelector((state) => state.orders);
  const [note, setNote] = useState('');

  async function onPlace() {
    dispatch(clearPlaceError());
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    const result = await dispatch(placeOrder({
      special_instruction: note.trim(),
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        special_instruction: item.specialInstruction,
        option_ids: item.customizations.map((option) => option.optionId),
      })),
    }));
    if (placeOrder.fulfilled.match(result)) {
      dispatch(clearCart());
      navigation.replace('OrderSuccess', { order: result.payload });
    }
  }

  if (!items.length) {
    return (
      <View style={ui.screen}>
        <ScreenHeader title="Confirm order" onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <Text style={ui.muted}>Your cart is empty. Browse the menu to place an order.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={ui.screen}>
      <ScreenHeader title="Confirm order" subtitle="Check every customization before placing the order." onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        {items.map((item) => (
          <View key={item.localId} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.quantity} × {item.product.name}</Text>
              <Text style={styles.price}>{money(itemTotal(item))}</Text>
            </View>
            {item.customizations.length ? <Text style={styles.detail}>{customizationText(item.customizations)}</Text> : null}
            {item.specialInstruction ? <Text style={styles.detail}>Note: {item.specialInstruction}</Text> : null}
          </View>
        ))}
        <Text style={styles.label}>Order note</Text>
        <TextInput
          style={[ui.input, styles.note]}
          multiline
          maxLength={250}
          placeholder="Optional note for the cafe"
          placeholderTextColor={colors.muted}
          value={note}
          onChangeText={setNote}
        />
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Estimated total</Text>
          <Text style={styles.total}>{money(cartTotal(items))}</Text>
        </View>
        <Text style={ui.muted}>The cafe confirms the final price when the order is placed.</Text>
        {placeError ? <Text style={ui.error}>{placeError}</Text> : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <PrimaryButton
          label={placing ? 'Placing order...' : user ? 'Place Order' : 'Sign in to place order'}
          onPress={onPlace}
          disabled={placing}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 10 },
  empty: { padding: 20 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  name: { flex: 1, fontWeight: '700', color: colors.espresso },
  price: { fontWeight: '700' },
  detail: { color: colors.muted, marginTop: 6, lineHeight: 20 },
  label: { fontWeight: '700', marginTop: 8 },
  note: { minHeight: 70, textAlignVertical: 'top' },
  totalLabel: { color: colors.muted },
  total: { fontWeight: '700', fontSize: 18 },
  footer: { padding: 20, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line },
});
