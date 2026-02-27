import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { useZoneStore } from '@/src/stores/zoneStore';
import { useTourStore } from '@/src/stores/tourStore';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const { hasSelectedZone } = useZoneStore();
  const { hasSeen } = useTourStore();

  // First-ever launch: show tour
  if (!hasSeen) return <Redirect href="/tour" />;
  // Not logged in
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  // Logged in but no zone picked
  if (!hasSelectedZone) return <Redirect href="/onboarding" />;
  // All good → home
  return <Redirect href="/(tabs)/home" />;
}
