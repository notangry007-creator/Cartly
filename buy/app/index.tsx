import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useZoneStore } from '../src/stores/zoneStore';
export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const { hasSelectedZone } = useZoneStore();
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (!hasSelectedZone) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/home" />;
}
