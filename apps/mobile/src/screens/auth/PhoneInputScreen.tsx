import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

interface PhoneInputScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'PhoneInput'>;
}

export function PhoneInputScreen({ navigation }: PhoneInputScreenProps) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (phone.length < 10) return;
    
    setIsLoading(true);
    // TODO: Call API to send OTP
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('OTPVerify', { phone });
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Enter your phone number</Text>
          <Text style={styles.subtitle}>
            We'll send you a code to verify it's you
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.countryCode}>+44</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor={colors.stone}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.button, phone.length < 10 && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={phone.length < 10 || isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Sending...' : 'Continue'}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  countryCode: {
    fontSize: fontSize.lg,
    color: colors.warmWhite,
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.warmWhite,
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
