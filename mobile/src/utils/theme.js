import { Platform, StyleSheet } from 'react-native';

export const colors = {
  bg: '#F6EFE6',
  card: '#FFFDF9',
  espresso: '#2C1810',
  terracotta: '#C4622D',
  terracottaDark: '#9A4A1F',
  cream: '#F3E1D4',
  text: '#2C1810',
  muted: '#8A7060',
  line: '#EADCCB',
  success: '#1F7A4D',
  danger: '#9D2C2C',
  white: '#FFFFFF',
};

export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  primary: {
    backgroundColor: colors.terracotta,
    borderRadius: 999,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  ghost: {
    backgroundColor: colors.card,
    borderRadius: 999,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 18,
  },
  ghostText: { color: colors.espresso, fontWeight: '700', fontSize: 15 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  title: { fontFamily: serif, fontSize: 28, color: colors.espresso },
  error: { color: colors.danger, fontSize: 14 },
});
