import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { colors, serif, ui } from '../utils/theme';
import { fetchHome, searchProducts } from '../redux/catalogSlice';
import CategoryCard from '../components/CategoryCard';
import ProductCard from '../components/ProductCard';
import PrimaryButton from '../components/PrimaryButton';

const cardWidth = (Dimensions.get('window').width - 52) / 2;

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const user = useSelector((state) => state.auth.user);
  const { categories, popular, homeLoading, homeError } = useSelector((state) => state.catalog);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  useFocusEffect(useCallback(() => {
    dispatch(fetchHome());
  }, [dispatch]));

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setSearchError(null);
      return undefined;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const action = await dispatch(searchProducts(query.trim()));
      setSearching(false);
      if (searchProducts.fulfilled.match(action)) {
        setResults(action.payload);
        setSearchError(null);
      } else {
        setSearchError(action.payload);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [dispatch, query]);

  const products = results || popular;
  const title = results ? 'Search results' : 'Popular';

  return (
    <View style={ui.screen}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={homeLoading} onRefresh={() => dispatch(fetchHome())} tintColor={colors.terracotta} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>CafeMate</Text>
            <Text style={ui.muted}>{user ? `Hello, ${user.first_name || user.username}` : 'Order tea, coffee, and snacks your way'}</Text>
          </View>
          <Pressable onPress={() => navigation.getParent()?.navigate('ProfileTab')} style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.first_name || user?.username || 'C').slice(0, 1).toUpperCase()}</Text>
          </Pressable>
        </View>
        <TextInput
          style={[ui.input, styles.search]}
          placeholder="Search tea, coffee, snacks"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />
        <Text style={styles.section}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => navigation.navigate('Category', { categoryId: category.id, title: category.name })}
            />
          ))}
        </ScrollView>
        <Text style={styles.section}>{title}</Text>
        {homeError || searchError ? (
          <View style={styles.message}>
            <Text style={ui.error}>{homeError || searchError}</Text>
            <PrimaryButton label="Try again" onPress={() => dispatch(fetchHome())} />
          </View>
        ) : null}
        {searching || (homeLoading && !products.length) ? <Text style={styles.loading}>Loading products...</Text> : null}
        {!homeLoading && !homeError && !products.length ? <Text style={styles.loading}>No products found.</Text> : null}
        <View style={styles.grid}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              style={{ width: cardWidth }}
              onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
            />
          ))}
        </View>
        {homeLoading ? <ActivityIndicator color={colors.terracotta} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontFamily: serif, fontSize: 34, color: colors.espresso },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '700' },
  search: { marginHorizontal: 20, marginTop: 16 },
  section: { fontFamily: serif, fontSize: 24, color: colors.espresso, marginTop: 22, marginHorizontal: 20, marginBottom: 12 },
  categories: { paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
  loading: { marginHorizontal: 20, color: colors.muted, marginBottom: 8 },
  message: { marginHorizontal: 20, gap: 10, marginBottom: 12 },
});
