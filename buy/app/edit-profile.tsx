import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, HelperText, Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuthStore } from '../src/stores/authStore';
import { useRouter } from 'expo-router';
import { useToast } from '../src/context/ToastContext';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { SPACING, RADIUS, theme } from '../src/theme';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});
type F = z.infer<typeof schema>;

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const [avatarUri, setAvatarUri] = useState(user?.avatarUrl ?? '');

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  });

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  const onSubmit = async (data: F) => {
    try {
      await updateProfile({ name: data.name, email: data.email || undefined, avatarUrl: avatarUri || undefined });
      showSuccess('Profile updated');
      router.back();
    } catch {
      showError('Failed to update profile');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[s.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Edit Profile" />
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <TouchableOpacity style={s.avatarSection} onPress={pickAvatar} activeOpacity={0.8}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={s.avatar} contentFit="cover" />
            ) : (
              <Avatar.Text
                size={80}
                label={(user?.name ?? 'U').charAt(0).toUpperCase()}
                style={{ backgroundColor: theme.colors.primary }}
                color="#fff"
              />
            )}
            <View style={s.avatarEditBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
            <Text variant="labelSmall" style={s.avatarHint}>Tap to change photo</Text>
          </TouchableOpacity>

          <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
            <TextInput label="Full Name *" value={value} onChangeText={onChange} mode="outlined" error={!!errors.name} left={<TextInput.Icon icon="account" />} />
          )} />
          {errors.name && <HelperText type="error">{errors.name.message}</HelperText>}

          <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
            <TextInput label="Email" value={value} onChangeText={onChange} mode="outlined" keyboardType="email-address" autoCapitalize="none" error={!!errors.email} left={<TextInput.Icon icon="email" />} />
          )} />
          {errors.email && <HelperText type="error">{errors.email.message}</HelperText>}

          <Text variant="labelSmall" style={s.phoneNote}>
            Phone: +977 {user?.phone} (cannot be changed)
          </Text>

          <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={s.btn} contentStyle={{ paddingVertical: SPACING.xs }}>
            Save Changes
          </Button>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: SPACING.xl, gap: SPACING.md },
  avatarSection: { alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm, position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarEditBadge: {
    position: 'absolute', bottom: 20, right: '35%',
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarHint: { color: '#888' },
  phoneNote: { color: '#999', textAlign: 'center' },
  btn: { marginTop: SPACING.sm },
});
