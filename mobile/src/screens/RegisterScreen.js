import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ui } from '../utils/theme';
import { register } from '../redux/authSlice';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    phone: '',
    password: '',
  });

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit() {
    const result = await dispatch(register({
      ...form,
      username: form.username.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
    }));
    if (register.fulfilled.match(result)) navigation.popToTop();
  }

  return (
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Create account" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>First name</Text>
        <TextInput style={ui.input} value={form.first_name} onChangeText={(value) => setField('first_name', value)} />
        <Text style={styles.label}>Last name</Text>
        <TextInput style={ui.input} value={form.last_name} onChangeText={(value) => setField('last_name', value)} />
        <Text style={styles.label}>Username</Text>
        <TextInput style={ui.input} autoCapitalize="none" value={form.username} onChangeText={(value) => setField('username', value)} />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={ui.input} keyboardType="phone-pad" value={form.phone} onChangeText={(value) => setField('phone', value)} />
        <Text style={styles.label}>Password</Text>
        <TextInput style={ui.input} secureTextEntry value={form.password} onChangeText={(value) => setField('password', value)} />
        {error ? <Text style={ui.error}>{error}</Text> : null}
        <PrimaryButton label={loading ? 'Creating...' : 'Create account'} onPress={onSubmit} disabled={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 8, paddingBottom: 40 },
  label: { fontWeight: '700', marginTop: 8 },
});
