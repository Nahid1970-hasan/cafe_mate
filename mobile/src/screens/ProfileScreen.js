import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { colors, serif, ui } from '../utils/theme';
import { DEFAULT_API_URL } from '../services/config';
import { logout } from '../redux/authSlice';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('api_url').then((value) => {
      if (value) setApiUrl(value);
    });
  }, []);

  async function saveServer() {
    await AsyncStorage.setItem('api_url', apiUrl.trim().replace(/\/$/, ''));
    setSaved(true);
  }

  return (
    <View style={ui.screen}>
      <ScreenHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Text style={styles.name}>{user ? user.full_name : 'Guest'}</Text>
          <Text style={ui.muted}>{user ? `${user.role} · @${user.username}` : 'Browse the menu, then sign in to order.'}</Text>
          {user?.phone ? <Text style={ui.muted}>{user.phone}</Text> : null}
        </View>
        {user ? (
          <PrimaryButton label="Sign out" variant="ghost" onPress={() => dispatch(logout())} />
        ) : (
          <PrimaryButton label="Sign in" onPress={() => navigation.navigate('Login')} />
        )}
        <Text style={styles.section}>API server</Text>
        <TextInput style={ui.input} value={apiUrl} onChangeText={setApiUrl} autoCapitalize="none" autoCorrect={false} />
        <Text style={ui.muted}>
          Use http://10.0.2.2:8000 on the Android emulator, http://localhost:8000 on iOS simulator, or your computer's IP from a phone.
        </Text>
        <PrimaryButton label={saved ? 'Saved' : 'Save server'} onPress={saveServer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, gap: 4 },
  name: { fontFamily: serif, fontSize: 28, color: colors.espresso },
  section: { fontWeight: '700', marginTop: 8, color: colors.espresso },
});
