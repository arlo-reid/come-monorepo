import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

interface OTPVerifyScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'OTPVerify'>;
  route: RouteProp<AuthStackParamList, 'OTPVerify'>;
}

export function OTPVerifyScreen({ navigation, route }: OTPVerifyScreenProps) {
  const { phone } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (newCode.every(c => c) && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleVerify = async (_otp: string) => {
    setIsLoading(true);
    // TODO: Call API to verify OTP
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('CreateProfile');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>Sent to +44 {phone}</Text>
          
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputs.current[index] = ref; }}
                style={styles.codeInput}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={text => handleCodeChange(text, index)}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.resendButton}>
            <Text style={styles.resendText}>Didn't get the code? Resend</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading && (
          <Text style={styles.loadingText}>Verifying...</Text>
        )}
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  codeInput: {
    width: 48,
    height: 56,
    backgroundColor: colors.charcoal,
    borderRadius: borderRadius.md,
    fontSize: fontSize.xl,
    color: colors.warmWhite,
    textAlign: 'center',
  },
  resendButton: {
    alignSelf: 'center',
  },
  resendText: {
    color: colors.ember,
    fontSize: fontSize.sm,
  },
  loadingText: {
    color: colors.ash,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
