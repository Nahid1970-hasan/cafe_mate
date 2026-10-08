import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { colors, serif, ui } from '../utils/theme';
import { itemUnit, money } from '../utils/format';
import { fetchProduct } from '../redux/catalogSlice';
import { addToCart, updateCartItem } from '../redux/cartSlice';
import { store } from '../redux/store';
import CustomizationOption from '../components/CustomizationOption';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';

const PREFERRED = ['2 Spoons', 'Normal', 'Hot', 'Medium', 'White', 'No Cheese', 'Room Temperature'];

function defaultSelection(groups) {
  const selected = {};
  groups.forEach((group) => {
    if (group.input_type !== 'single') {
      selected[group.id] = [];
      return;
    }
    const preferred = group.options.find((option) => PREFERRED.includes(option.value));
    const fallback = group.is_required ? group.options[0] : null;
    const choice = preferred || fallback;
    selected[group.id] = choice ? [choice.id] : [];
  });
  return selected;
}

function selectionFromCart(groups, cartItem) {
  const selected = {};
  groups.forEach((group) => {
    selected[group.id] = group.options
      .filter((option) => cartItem.customizations.some((entry) => entry.optionId === option.id))
      .map((option) => option.id);
  });
  return selected;
}

export default function ProductDetailsScreen({ navigation, route }) {
  const { productId, cartItemId } = route.params;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { product, groups, detailLoading, detailError } = useSelector((state) => state.catalog);
  const [selected, setSelected] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const action = await dispatch(fetchProduct(productId));
      if (!active || !fetchProduct.fulfilled.match(action)) return;
      const loadedGroups = action.payload.groups;
      const existing = store.getState().cart.items.find((item) => item.localId === cartItemId);
      if (existing) {
        setSelected(selectionFromCart(loadedGroups, existing));
        setQuantity(existing.quantity);
        setNote(existing.specialInstruction || '');
      } else {
        setSelected(defaultSelection(loadedGroups));
        setQuantity(1);
        setNote('');
      }
    })();
    return () => {
      active = false;
    };
  }, [cartItemId, dispatch, productId]);

  const customizations = useMemo(() => {
    const list = [];
    groups.forEach((group) => {
      (selected[group.id] || []).forEach((optionId) => {
        const option = group.options.find((entry) => entry.id === optionId);
        if (!option) return;
        list.push({
          optionId: option.id,
          groupName: group.name,
          optionValue: option.value,
          extraPrice: Number(option.extra_price),
        });
      });
    });
    return list;
  }, [groups, selected]);

  const estimate = product ? itemUnit({ product, customizations }) * quantity : 0;

  function toggle(group, optionId) {
    setSelected((current) => {
      const existing = current[group.id] || [];
      if (group.input_type === 'single') return { ...current, [group.id]: [optionId] };
      const has = existing.includes(optionId);
      return {
        ...current,
        [group.id]: has ? existing.filter((id) => id !== optionId) : [...existing, optionId],
      };
    });
  }

  function validate() {
    for (const group of groups) {
      const count = (selected[group.id] || []).length;
      if (group.input_type === 'single') {
        if (group.is_required && count !== 1) return `Please choose ${group.name}.`;
        if (count > 1) return `Choose only one option for ${group.name}.`;
      } else if (group.is_required && count < 1) {
        return `Please choose ${group.name}.`;
      }
    }
    if (note.length > 250) return 'Special instruction must be 250 characters or fewer.';
    return '';
  }

  function onAdd() {
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    const payload = {
      localId: cartItemId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        emoji: product.category?.emoji,
        preparation_time: product.preparation_time,
      },
      quantity,
      customizations,
      specialInstruction: note.trim(),
    };
    if (cartItemId) dispatch(updateCartItem(payload));
    else dispatch(addToCart(payload));
    navigation.navigate('CartTab', { screen: 'Cart' });
  }

  if (detailLoading || !product) {
    return (
      <View style={ui.screen}>
        <ScreenHeader title="Product" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={ui.muted}>{detailError || 'Loading products...'}</Text>
          {detailError ? <PrimaryButton label="Try again" onPress={() => dispatch(fetchProduct(productId))} /> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={ui.screen}>
      <ScreenHeader title={product.name} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.art}>
          {product.image ? <Image source={{ uri: product.image }} style={styles.image} /> : <Text style={styles.emoji}>{product.category?.emoji || '☕'}</Text>}
        </View>
        <Text style={styles.price}>{money(product.price)}</Text>
        <Text style={styles.desc}>{product.description}</Text>
        {product.ingredients ? <Text style={ui.muted}>Ingredients: {product.ingredients}</Text> : null}
        <Text style={ui.muted}>Ready in about {product.preparation_time} min</Text>
        {groups.map((group) => (
          <View key={group.id} style={styles.group}>
            <Text style={styles.groupTitle}>{group.name}{group.is_required ? ' *' : ''}</Text>
            <View style={styles.options}>
              {group.options.map((option) => (
                <CustomizationOption
                  key={option.id}
                  label={option.value}
                  price={option.extra_price}
                  selected={(selected[group.id] || []).includes(option.id)}
                  onPress={() => toggle(group, option.id)}
                />
              ))}
            </View>
          </View>
        ))}
        <Text style={styles.groupTitle}>Special instruction</Text>
        <TextInput
          style={[ui.input, styles.note]}
          multiline
          maxLength={250}
          placeholder="Please make the tea slightly less hot."
          placeholderTextColor={colors.muted}
          value={note}
          onChangeText={setNote}
        />
        <Text style={styles.count}>{note.length}/250</Text>
        {formError ? <Text style={ui.error}>{formError}</Text> : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.qtyRow}>
          <PrimaryButton variant="ghost" label="−" onPress={() => setQuantity((value) => Math.max(1, value - 1))} />
          <Text style={styles.qty}>{quantity}</Text>
          <PrimaryButton variant="ghost" label="+" onPress={() => setQuantity((value) => Math.min(99, value + 1))} />
          <Text style={styles.estimate}>{money(estimate)}</Text>
        </View>
        <PrimaryButton label={cartItemId ? 'Update cart' : 'Add to cart'} onPress={onAdd} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, paddingBottom: 24 },
  center: { padding: 20, gap: 12 },
  art: {
    height: 180,
    borderRadius: 22,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  emoji: { fontSize: 72 },
  price: { fontFamily: serif, fontSize: 28, color: colors.terracotta, marginTop: 14 },
  desc: { color: colors.text, marginTop: 6, lineHeight: 22 },
  group: { marginTop: 18 },
  groupTitle: { fontWeight: '700', color: colors.espresso, marginBottom: 8, marginTop: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap' },
  note: { minHeight: 80, textAlignVertical: 'top' },
  count: { alignSelf: 'flex-end', color: colors.muted, fontSize: 12 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 10,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qty: { minWidth: 24, textAlign: 'center', fontWeight: '700', fontSize: 18 },
  estimate: { marginLeft: 'auto', fontFamily: serif, fontSize: 24, color: colors.espresso },
});
