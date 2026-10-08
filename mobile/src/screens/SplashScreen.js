import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useDispatch } from 'react-redux';
import { colors, serif } from '../utils/theme';
import { loadSession } from '../redux/authSlice';
import { loadCart } from '../redux/cartSlice';

export default function SplashScreen({ navigation }) {
  const dispatch = useDispatch();

  useEffect(() => {
    let active = true;
    (async () => {
      await Promise.all([
        dispatch(loadSession()),
        dispatch(loadCart()),
        new Promise((resolve) => setTimeout(resolve, 1100)),
      ]);
      if (active) navigation.replace('Main');
    })();
    return () => {
      active = false;
    };
  }, [dispatch, navigation]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Text style={styles.emoji}>☕</Text>
      <Text style={styles.title}>CafeMate</Text>
      <Text style={styles.tag}>Tea, coffee, and snacks — made your way.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: { fontSize: 64 },
  title: { fontFamily: serif, fontSize: 48, color: '#F6EFE6', marginTop: 8 },
  tag: { color: '#E7CDB8', textAlign: 'center', marginTop: 8, fontSize: 16 },
});
