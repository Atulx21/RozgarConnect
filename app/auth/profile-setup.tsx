import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { validateMobileNumber, sanitizeInput } from '@/utils/validation';

export default function ProfileSetupScreen() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [village, setVillage] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetupProfile = async () => {
    if (!fullName.trim() || !mobileNumber.trim() || !village.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!validateMobileNumber(mobileNumber.trim())) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found. Please try logging in again.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: sanitizeInput(fullName),
        mobile_number: mobileNumber.trim().replace(/\s+/g, ''),
        village: sanitizeInput(village),
        bio: sanitizeInput(bio),
        experience_years: 0,
      });

      if (error) throw error;

      Alert.alert('Success', 'Profile created successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="person-add" size={48} color="#6DD5A5" />
          </View>
          <Text variant="headlineMedium" style={styles.title}>
            Complete Your Profile
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Tell us about yourself and your skills
          </Text>
        </View>

        <Card style={styles.formCard} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Basic Information
            </Text>

            <TextInput
              mode="outlined"
              label="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={
                <TextInput.Icon
                  icon={() => <MaterialIcons name="person" size={24} color="#718096" />}
                />
              }
              placeholder="Enter your full name"
            />

            <TextInput
              mode="outlined"
              label="Mobile Number *"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              style={styles.input}
              keyboardType="phone-pad"
              outlineStyle={styles.inputOutline}
              left={
                <TextInput.Icon
                  icon={() => <MaterialIcons name="phone" size={24} color="#718096" />}
                />
              }
              placeholder="10-digit mobile number"
            />

            <TextInput
              mode="outlined"
              label="Village/Town *"
              value={village}
              onChangeText={setVillage}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={
                <TextInput.Icon
                  icon={() => <MaterialIcons name="location-on" size={24} color="#718096" />}
                />
              }
              placeholder="Enter your village or town"
            />

            <TextInput
              mode="outlined"
              label="Bio (Optional)"
              value={bio}
              onChangeText={setBio}
              style={styles.bioInput}
              multiline
              numberOfLines={4}
              outlineStyle={styles.inputOutline}
              left={
                <TextInput.Icon
                  icon={() => <MaterialIcons name="description" size={24} color="#718096" />}
                />
              }
              placeholder="Tell others about your skills and experience"
            />

            <Button
              mode="contained"
              onPress={handleSetupProfile}
              loading={loading}
              disabled={loading}
              style={styles.setupButton}
              contentStyle={styles.setupButtonContent}
              icon={({ size, color }) => (
                <MaterialIcons name="check-circle" size={size} color={color} />
              )}
            >
              Complete Setup
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#E8F7EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#6DD5A5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#2D3748',
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    color: '#718096',
    lineHeight: 24,
  },
  formCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  sectionTitle: {
    color: '#2D3748',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  bioInput: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  inputOutline: {
    borderRadius: 16,
    borderColor: '#E2E8F0',
  },
  setupButton: {
    borderRadius: 16,
    backgroundColor: '#6DD5A5',
    elevation: 2,
    shadowColor: '#6DD5A5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  setupButtonContent: {
    paddingVertical: 10,
  },
});
