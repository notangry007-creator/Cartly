import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SPACING, RADIUS } from '../../theme';

interface Props {
  endsAt: string; // ISO timestamp
  onExpire?: () => void;
  compact?: boolean;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function getTimeLeft(endsAt: string): { hours: number; minutes: number; seconds: number; expired: boolean } {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, expired: false };
}

export default function FlashSaleCountdown({ endsAt, onExpire, compact = false }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endsAt));

  useEffect(() => {
    if (timeLeft.expired) {
      onExpire?.();
      return;
    }
    const interval = setInterval(() => {
      const tl = getTimeLeft(endsAt);
      setTimeLeft(tl);
      if (tl.expired) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (timeLeft.expired) return null;

  if (compact) {
    return (
      <View style={s.compactRow}>
        <Text style={s.compactLabel}>Ends in</Text>
        <View style={s.compactTimer}>
          <Text style={s.compactTime}>
            {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.row}>
      <Text style={s.label}>Ends in</Text>
      <View style={s.block}>
        <Text style={s.num}>{pad(timeLeft.hours)}</Text>
        <Text style={s.unit}>h</Text>
      </View>
      <Text style={s.sep}>:</Text>
      <View style={s.block}>
        <Text style={s.num}>{pad(timeLeft.minutes)}</Text>
        <Text style={s.unit}>m</Text>
      </View>
      <Text style={s.sep}>:</Text>
      <View style={s.block}>
        <Text style={s.num}>{pad(timeLeft.seconds)}</Text>
        <Text style={s.unit}>s</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 2,
  },
  block: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    minWidth: 32,
  },
  num: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  unit: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '600',
  },
  sep: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  // Compact variant
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  compactLabel: {
    color: '#E53935',
    fontSize: 10,
    fontWeight: '600',
  },
  compactTimer: {
    backgroundColor: '#E53935',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  compactTime: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
