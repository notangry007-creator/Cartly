import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme, SPACING } from '../../theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={s.container}>
          <Ionicons name="warning" size={56} color={theme.colors.primary} />
          <Text variant="headlineSmall" style={s.title}>Something went wrong</Text>
          <Text variant="bodySmall" style={s.sub}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Text>
          <Button mode="contained" onPress={this.reset} style={s.btn}>
            Try Again
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl, gap: SPACING.md, backgroundColor: '#fff' },
  title: { fontWeight: '700', color: '#222', textAlign: 'center' },
  sub: { color: '#888', textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: SPACING.sm },
});
