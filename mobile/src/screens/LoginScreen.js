import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { colors, serif, ui } from '../utils/theme';
import { DEFAULT_API_URL } from '../services/config';
import { clearAuthError, login } from '../redux/authSlice';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);

  useEffect(() => {
    dispatch(clearAuthError());
    AsyncStorage.getItem('api_url').then((value) => {
      if (value) setApiUrl(value);
    });
  }, [dispatch]);

  async function onSubmit() {
    await AsyncStorage.setItem('api_url', apiUrl.trim().replace(/\/$/, ''));
    const result = await dispatch(login({ username: username.trim(), password }));
    if (login.fulfilled.match(result)) {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.replace('Main');
    }
  }

  return (
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Sign in" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>Sign in to place an order and follow its status.</Text>
        <Text style={styles.label}>Username</Text>
        <TextInput style={ui.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
        <Text style={styles.label}>Password</Text>
        <TextInput style={ui.input} value={password} onChangeText={setPassword} secureTextEntry />
        <Text style={styles.label}>API server</Text>
        <TextInput style={ui.input} value={apiUrl} onChangeText={setApiUrl} autoCapitalize="none" autoCorrect={false} />
        <Text style={ui.muted}>
          Android emulator uses http://10.0.2.2:8000. A phone on the same Wi-Fi uses your computer IP, for example http://192.168.0.10:8000.
        </Text>
        {error ? <Text style={ui.error}>{error}</Text> : null}
        <PrimaryButton label={loading ? 'Signing in...' : 'Sign in'} onPress={onSubmit} disabled={loading} />
        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Create an account</Text>
        </Pressable>
        <View style={styles.demo}>
          <Text style={styles.demoTitle}>Customer demo</Text>
          <Text style={ui.muted}>nahid / nahid123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 8, paddingBottom: 40 },
  lead: { color: colors.muted, marginBottom: 8 },
  label: { fontWeight: '700', color: colors.espresso, marginTop: 8 },
  link: { textAlign: 'center', color: colors.terracotta, fontWeight: '700', marginTop: 8 },
  demo: { marginTop: 18, backgroundColor: colors.card, borderRadius: 16, padding: 14 },
  demoTitle: { fontFamily: serif, fontSize: 18, color: colors.espresso, marginBottom: 4 },
});
