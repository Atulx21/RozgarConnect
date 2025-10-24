import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { validateEmail, validatePassword } from '@/utils/validation';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Real-time email validation
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError && text.trim()) {
      setEmailError('');
    }
  };

  // Real-time password validation
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError && text) {
      setPasswordError('');
    }
  };

  const validateInputs = (): boolean => {
    let isValid = true;

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setPasswordError(passwordValidation.message || 'Invalid password');
        isValid = false;
      } else {
        setPasswordError('');
      }
    }

    return isValid;
  };

  const handleAuth = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    // Validate inputs
    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.user) {
          Alert.alert(
            'Success',
            'Account created successfully! Please complete your profile.',
            [{ text: 'Continue', onPress: () => router.replace('/auth/profile-setup') }]
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
        }

        if (!profile) {
          router.replace('/auth/profile-setup');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'An unexpected error occurred';
      
      // Handle specific error cases
      if (errorMessage.includes('Invalid login credentials')) {
        Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
      } else if (errorMessage.includes('Email not confirmed')) {
        Alert.alert('Email Not Confirmed', 'Please check your email and confirm your account.');
      } else if (errorMessage.includes('User already registered')) {
        Alert.alert('Account Exists', 'An account with this email already exists. Please sign in.');
        setIsSignUp(false);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setEmailError('');
    setPasswordError('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="handshake" size={56} color="#10B981" />
          </View>
          <Text variant="displaySmall" style={styles.title}>
            RozgarConnect
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Connect with local work opportunities
          </Text>
        </View>

        {/* Form Card */}
        <Card style={styles.formCard} mode="elevated">
          <Card.Content style={styles.cardContent}>
            <Text variant="headlineSmall" style={styles.formTitle}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text variant="bodyMedium" style={styles.formSubtitle}>
              {isSignUp
                ? 'Sign up to start connecting with opportunities'
                : 'Sign in to continue your journey'}
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                label="Email"
                value={email}
                onChangeText={handleEmailChange}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                error={!!emailError}
                disabled={loading}
                outlineStyle={styles.inputOutline}
                activeOutlineColor="#10B981"
                left={
                  <TextInput.Icon
                    icon={() => (
                      <MaterialIcons
                        name="email"
                        size={24}
                        color={emailError ? '#EF4444' : '#718096'}
                      />
                    )}
                  />
                }
              />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                label="Password"
                value={password}
                onChangeText={handlePasswordChange}
                style={styles.input}
                secureTextEntry={!showPassword}
                autoComplete={isSignUp ? 'password-new' : 'password'}
                textContentType={isSignUp ? 'newPassword' : 'password'}
                error={!!passwordError}
                disabled={loading}
                outlineStyle={styles.inputOutline}
                activeOutlineColor="#10B981"
                left={
                  <TextInput.Icon
                    icon={() => (
                      <MaterialIcons
                        name="lock"
                        size={24}
                        color={passwordError ? '#EF4444' : '#718096'}
                      />
                    )}
                  />
                }
                right={
                  <TextInput.Icon
                    icon={() => (
                      <MaterialIcons
                        name={showPassword ? 'visibility' : 'visibility-off'}
                        size={24}
                        color="#718096"
                      />
                    )}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Forgot Password Link (only for sign in) */}
            {!isSignUp && (
              <TouchableOpacity
                onPress={() => Alert.alert('Info', 'Password reset feature coming soon!')}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Auth Button */}
            <Button
              mode="contained"
              onPress={handleAuth}
              loading={loading}
              disabled={loading}
              style={styles.authButton}
              contentStyle={styles.authButtonContent}
              labelStyle={styles.authButtonLabel}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Switch Auth Mode Button */}
            <Button
              mode="text"
              onPress={toggleAuthMode}
              disabled={loading}
              style={styles.switchButton}
              contentStyle={styles.switchButtonContent}
              labelStyle={styles.switchButtonLabel}
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Button>
          </Card.Content>
        </Card>

        {/* Footer */}
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAF9',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#1F2937',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formCard: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    marginBottom: 24,
  },
  cardContent: {
    paddingVertical: 8,
  },
  formTitle: {
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    color: '#6B7280',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  inputOutline: {
    borderRadius: 16,
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 12,
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  authButton: {
    borderRadius: 16,
    backgroundColor: '#10B981',
    marginTop: 8,
    elevation: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  authButtonContent: {
    paddingVertical: 10,
  },
  authButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#9CA3AF',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  switchButton: {
    borderRadius: 16,
  },
  switchButtonContent: {
    paddingVertical: 8,
  },
  switchButtonLabel: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 32,
  },
});