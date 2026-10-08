import React, { useEffect } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ui } from '../utils/theme';
import { fetchCategoryProducts } from '../redux/catalogSlice';
import ProductCard from '../components/ProductCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';

const cardWidth = (Dimensions.get('window').width - 52) / 2;

export default function CategoryScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { categoryId, title } = route.params;
  const { categoryProducts, listLoading, listError } = useSelector((state) => state.catalog);

  useEffect(() => {
    dispatch(fetchCategoryProducts(categoryId));
  }, [categoryId, dispatch]);

  return (
    <View style={ui.screen}>
      <ScreenHeader title={title} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        {listLoading ? <Text style={ui.muted}>Loading products...</Text> : null}
        {listError ? (
          <View style={styles.message}>
            <Text style={ui.error}>{listError}</Text>
            <PrimaryButton label="Try again" onPress={() => dispatch(fetchCategoryProducts(categoryId))} />
          </View>
        ) : null}
        {!listLoading && !listError && !categoryProducts.length ? (
          <Text style={ui.muted}>No products in this category yet.</Text>
        ) : null}
        <View style={styles.grid}>
          {categoryProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              style={{ width: cardWidth }}
              onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  message: { gap: 10, marginBottom: 12 },
});
