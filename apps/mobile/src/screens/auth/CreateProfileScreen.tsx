import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

export function CreateProfileScreen() {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const handleComplete = async () => {
    if (!name.trim()) return;
    
    setIsLoading(true);
    // TODO: Call API to create profile
    setTimeout(() => {
      login(
        {
          id: crypto.randomUUID(),
          phone: '+447123456789',
          name: name.trim(),
          createdAt: new Date().toISOString(),
        },
        'mock-token'
      );
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Create your profile</Text>
          <Text style={styles.subtitle}>How should we call you?</Text>

          <TouchableOpacity style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>📷</Text>
            </View>
            <Text style={styles.avatarLabel}>Add photo</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.stone}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.button, !name.trim() && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={!name.trim() || isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Creating...' : 'Complete'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.midnight,
  },
  keyboardView: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingTop: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.warmWhite,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.ash,
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 32,
  },
  avatarLabel: {
    color: colors.ember,
    fontSize: fontSize.sm,
  },
  input: {
    fontSize: fontSize.lg,
    color: colors.warmWhite,
    backgroundColor: colors.charcoal,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  button: {
    backgroundColor: colors.ember,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  buttonDisabled: {
    backgroundColor: colors.muted,
  },
  buttonText: {
    color: colors.warmWhite,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
});
