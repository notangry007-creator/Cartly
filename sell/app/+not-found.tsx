import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius } from '@/src/theme';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="alert-circle-outline" size={72} color={Colors.grey300} />
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.subtitle}>This screen doesn't exist.</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)/dashboard')}>
        <Text style={styles.btnText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.xl },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.sm, marginBottom: Spacing.xl },
  btn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: BorderRadius.md },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
});
