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
import { Text, TextInput } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { validateEmail, validatePassword } from '@/utils/validation';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

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
    <View style={styles.container}>
      {/* Clean Background with Subtle Blurred Circles */}
      <LinearGradient
        colors={['#F0FDF4', '#DCFCE7', '#E8F5E9']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Subtle Blurred Accent Circles */}
      <View style={[styles.blurCircle, styles.blurCircle1]} />
      <View style={[styles.blurCircle, styles.blurCircle2]} />
      <View style={[styles.blurCircle, styles.blurCircle3]} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
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
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.logoGradient}
              >
                <MaterialIcons name="handshake" size={48} color="#FFFFFF" />
              </LinearGradient>
            </View>
            
            <Text variant="displaySmall" style={styles.title}>
              RozgarConnect
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Connect with local work opportunities
            </Text>
          </View>

          {/* Clean Modern Form Card */}
          <View style={styles.formCard}>
            <BlurView intensity={20} tint="light" style={styles.cardBlur}>
              <View style={styles.cardContent}>
                <Text variant="headlineMedium" style={styles.formTitle}>
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
                    outlineColor="rgba(16, 185, 129, 0.2)"
                    activeOutlineColor="#10B981"
                    outlineStyle={styles.inputOutline}
                    contentStyle={styles.inputContent}
                    theme={{
                      colors: {
                        background: '#FFFFFF',
                      },
                    }}
                    left={
                      <TextInput.Icon
                        icon={() => (
                          <MaterialIcons
                            name="email"
                            size={22}
                            color={emailError ? '#EF4444' : '#10B981'}
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
                    outlineColor="rgba(16, 185, 129, 0.2)"
                    activeOutlineColor="#10B981"
                    outlineStyle={styles.inputOutline}
                    contentStyle={styles.inputContent}
                    theme={{
                      colors: {
                        background: '#FFFFFF',
                      },
                    }}
                    left={
                      <TextInput.Icon
                        icon={() => (
                          <MaterialIcons
                            name="lock"
                            size={22}
                            color={passwordError ? '#EF4444' : '#10B981'}
                          />
                        )}
                      />
                    }
                    right={
                      <TextInput.Icon
                        icon={() => (
                          <MaterialIcons
                            name={showPassword ? 'visibility' : 'visibility-off'}
                            size={22}
                            color="#10B981"
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

                {/* Forgot Password Link */}
                {!isSignUp && (
                  <TouchableOpacity
                    onPress={() => Alert.alert('Info', 'Password reset feature coming soon!')}
                    style={styles.forgotPasswordContainer}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                )}

                {/* Auth Button */}
                <TouchableOpacity
                  onPress={handleAuth}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={styles.authButtonContainer}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.authButton}
                  >
                    <Text style={styles.authButtonText}>
                      {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
                    </Text>
                    {!loading && (
                      <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Switch Auth Mode Button */}
                <TouchableOpacity
                  onPress={toggleAuthMode}
                  disabled={loading}
                  style={styles.switchButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchButtonText}>
                    {isSignUp
                      ? 'Already have an account? '
                      : "Don't have an account? "}
                    <Text style={styles.switchButtonTextBold}>
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  blurCircle1: {
    width: 280,
    height: 280,
    top: -80,
    right: -60,
  },
  blurCircle2: {
    width: 220,
    height: 220,
    bottom: -40,
    left: -50,
  },
  blurCircle3: {
    width: 180,
    height: 180,
    top: height * 0.45,
    right: -30,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 60 : 50,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 32,
  },
  formCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  cardBlur: {
    overflow: 'hidden',
  },
  cardContent: {
    padding: 24,
  },
  formTitle: {
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  inputOutline: {
    borderRadius: 16,
  },
  inputContent: {
    paddingLeft: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 12,
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 4,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  authButtonContainer: {
    marginBottom: 4,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  dividerText: {
    color: '#9CA3AF',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  switchButtonText: {
    color: '#6B7280',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  switchButtonTextBold: {
    color: '#10B981',
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 40,
  },
  footerLink: {
    color: '#10B981',
    fontWeight: '600',
  },
});