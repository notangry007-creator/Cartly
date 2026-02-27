import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../../theme';
interface Props { icon?: string; title: string; subtitle?: string; actionLabel?: string; onAction?: () => void; }
export default function EmptyState({ icon='cube-outline', title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={s.container}>
      <Ionicons name={icon as any} size={64} color="#ccc" />
      <Text variant="titleMedium" style={s.title}>{title}</Text>
      {subtitle && <Text variant="bodySmall" style={s.sub}>{subtitle}</Text>}
      {actionLabel && onAction && <Button mode="contained" onPress={onAction} style={s.btn}>{actionLabel}</Button>}
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:SPACING.xxl, gap:SPACING.md },
  title: { color:'#555', fontWeight:'600', textAlign:'center' },
  sub: { color:'#999', textAlign:'center' },
  btn: { marginTop:SPACING.md },
});
