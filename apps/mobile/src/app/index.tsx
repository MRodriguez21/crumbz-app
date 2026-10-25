import { APP_NAME } from '@crumbz/shared';
import { useTheme } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

// Placeholder until the design system (phase 0.5) and auth (phase 1) land.
export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{APP_NAME}</Text>
      <Text style={{ color: colors.text }}>Muy pronto: descubre dónde comer en Caracas.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
});
