import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function EditProfileScreen() {
  const { profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [village, setVillage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setVillage(profile.village);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!fullName.trim() || !village.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        village: village.trim(),
      });

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button 
          mode="text" 
          onPress={() => router.back()}
          icon="arrow-left"
          style={styles.backButton}
        >
          Back
        </Button>
        <Text variant="headlineSmall" style={styles.title}>
          Edit Profile
        </Text>
      </View>

      <Card style={styles.formCard}>
        <Card.Content>
          <TextInput
            mode="outlined"
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            mode="outlined"
            label="Village/Town"
            value={village}
            onChangeText={setVillage}
            style={styles.input}
            left={<TextInput.Icon icon="map-marker" />}
          />

          <View style={styles.roleDisplay}>
            <Text variant="bodyMedium" style={styles.roleLabel}>
              Role:
            </Text>
            <Text variant="bodyLarge" style={styles.roleText}>
              {profile?.role === 'worker' ? '👷‍♂️ Worker' : '🏢 Work Provider'}
            </Text>
          </View>

          <Button 
            mode="contained" 
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
            icon="content-save"
          >
            Save Changes
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  title: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  formCard: {
    margin: 15,
    elevation: 2,
  },
  input: {
    marginBottom: 20,
  },
  roleDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  roleLabel: {
    color: '#666',
  },
  roleText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 5,
  },
});