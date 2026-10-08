import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, serif } from '../utils/theme';
import { money } from '../utils/format';

export default function ProductCard({ product, onPress, style }) {
  return (
    <Pressable style={[styles.card, style]} onPress={onPress}>
      <View style={styles.art}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} />
        ) : (
          <Text style={styles.emoji}>{product.category?.emoji || '🍽️'}</Text>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
      <Text style={styles.meta}>{product.preparation_time} min</Text>
      <Text style={styles.price}>{money(product.price)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
  },
  art: {
    height: 110,
    borderRadius: 14,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  emoji: { fontSize: 40 },
  name: { marginTop: 10, fontFamily: serif, fontSize: 16, color: colors.espresso },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  price: { marginTop: 6, fontWeight: '700', color: colors.terracotta },
});
