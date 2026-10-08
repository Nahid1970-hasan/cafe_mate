import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';

function CartPersist() {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  useEffect(() => {
    if (!cart.hydrated) return;
    AsyncStorage.setItem('cart', JSON.stringify(cart.items));
  }, [cart.hydrated, cart.items, dispatch]);

  return null;
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <CartPersist />
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}
