import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '@/hooks/useAuth';

export default function EditProfileScreen() {
  const { profile, updateProfile, user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setVillage(profile.village);
      setPhone(profile.phone);
      setCurrentAvatarUrl(profile.avatar_url);
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const uploadImage = async () => {
    if (!image?.base64) return currentAvatarUrl;

    try {
      const fileName = `profile-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(fileName, decode(image.base64), {
          contentType: 'image/jpeg'
        });

      if (error) throw error;

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        await supabase.storage
          .from('profiles')
          .remove([currentAvatarUrl]);
      }

      return fileName;
    } catch (error) {
      console.error('Error uploading image:', error);
      return currentAvatarUrl;
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    setUploading(true);
    try {
      const imageUrl = await uploadImage();
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        phone,
        village,
        avatar_url: imageUrl,
      });

      if (error) throw error;
      // Navigate back or show success message
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setUploading(false);
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
          <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center', marginBottom: 20 }}>
            {(image || currentAvatarUrl) ? (
              <Image 
                source={{ 
                  uri: image ? image.uri : `${supabase.storage.from('profiles').getPublicUrl(currentAvatarUrl).data.publicUrl}`
                }} 
                style={{ width: 100, height: 100, borderRadius: 50 }} 
              />
            ) : (
              <View style={{ 
                width: 100, 
                height: 100, 
                borderRadius: 50, 
                backgroundColor: '#e1e1e1',
                justifyContent: 'center',
                alignItems: 'center' 
              }}>
                <Text>Change Photo</Text>
              </View>
            )}
          </TouchableOpacity>

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

          <TextInput
            mode="outlined"
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
            left={<TextInput.Icon icon="phone" />}
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
            onPress={handleSubmit}
            loading={loading || uploading}
            disabled={loading || uploading}
            style={styles.saveButton}
            icon="content-save"
          >
            {loading || uploading ? 'Saving...' : 'Save Changes'}
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