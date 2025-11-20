import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { Button, Card, TextInput, Text, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { validateMobileNumber, sanitizeInput } from '@/utils/validation';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function ProfileSetupScreen() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [village, setVillage] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access photos');
        return;
      }

      setUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadImage = async () => {
    if (!image?.base64) return null;

    try {
      const fileName = `profile-${user.id}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(fileName, decode(image.base64), {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) throw error;
      return fileName;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Warning', 'Failed to upload image, but profile will be created');
      return null;
    }
  };

  const handleSetupProfile = async () => {
    // Validation
    if (!fullName.trim() || !mobileNumber.trim() || !village.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Full Name, Mobile Number, and Village/Town)');
      return;
    }

    if (!validateMobileNumber(mobileNumber.trim())) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found. Please try logging in again.');
      return;
    }

    setLoading(true);
    try {
      // Upload image first
      const imageUrl = await uploadImage();
      
      // Create/update profile
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: sanitizeInput(fullName),
        mobile_number: mobileNumber.trim().replace(/\s+/g, ''),
        village: sanitizeInput(village),
        bio: bio ? sanitizeInput(bio) : null,
        avatar_url: imageUrl,
        experience_years: 0,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      Alert.alert(
        'Success! 🎉', 
        'Your profile has been created successfully!', 
        [
          { 
            text: 'Get Started', 
            onPress: () => router.replace('/(tabs)') 
          }
        ]
      );
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to create profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
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
        {/* Header */}
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

        {/* Form Card */}
        <Card style={styles.formCard} elevation={4}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Profile Photo
            </Text>

            {/* Profile Image Picker */}
            <TouchableOpacity 
              onPress={pickImage} 
              style={styles.imagePickerContainer}
              activeOpacity={0.7}
              disabled={loading || uploadingImage}
            >
              {uploadingImage ? (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator size="large" color="#6DD5A5" />
                  <Text style={styles.imagePlaceholderText}>Loading...</Text>
                </View>
              ) : image ? (
                <View style={styles.imageWrapper}>
                  <Image 
                    source={{ uri: image.uri }} 
                    style={styles.profileImage} 
                  />
                  <View style={styles.imageOverlay}>
                    <MaterialIcons name="photo-camera" size={24} color="white" />
                    <Text style={styles.changePhotoText}>Change</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons name="add-a-photo" size={40} color="#718096" />
                  <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                  <Text style={styles.imageSubtext}>Optional</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Basic Information Section */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Basic Information
            </Text>

            {/* Full Name Input */}
            <TextInput
              mode="outlined"
              label="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="#6DD5A5"
              left={
                <TextInput.Icon
                  icon={() => <MaterialIcons name="person" size={24} color="#718096" />}
                />
              }
              placeholder="Enter your full name"
              autoCapitalize="words"
              disabled={loading}
              error={fullName.length > 0 && fullName.trim().length < 2}
            />
            {fullName.length > 0 && fullName.trim().length < 2 && (
              <Text style={styles.errorText}>Name must be at least 2 characters</Text>
            )}

            {/* Mobile Number Input */}
            <TextInput
              mode="outlined"
              label="Mobile Number *"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={10}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="#6DD5A5"
              left={
                <TextInput.Icon
                  icon={() => <MaterialIcons name="phone" size={24} color="#718096" />}
                />
              }
              placeholder="10-digit mobile number"
              disabled={loading}
              error={mobileNumber.length > 0 && !validateMobileNumber(mobileNumber)}
            />
            {mobileNumber.length > 0 && !validateMobileNumber(mobileNumber) && (
              <Text style={styles.errorText}>Please enter a valid 10-digit number</Text>
            )}

            {/* Village Input */}
            <TextInput
              mode="outlined"
              label="Village/Town *"
              value={village}
              onChangeText={setVillage}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="#6DD5A5"
              left={
                <TextInput.Icon
                  icon={() => <MaterialIcons name="location-on" size={24} color="#718096" />}
                />
              }
              placeholder="Enter your village or town"
              autoCapitalize="words"
              disabled={loading}
            />

            {/* Bio Input */}
            <TextInput
              mode="outlined"
              label="Bio (Optional)"
              value={bio}
              onChangeText={setBio}
              style={styles.bioInput}
              multiline
              numberOfLines={4}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="#6DD5A5"
              left={
                <TextInput.Icon
                  icon={() => <MaterialIcons name="description" size={24} color="#718096" />}
                />
              }
              placeholder="Tell others about your skills and experience"
              maxLength={500}
              disabled={loading}
            />

            {/* Character count for bio */}
            <Text style={styles.characterCount}>
              {bio.length}/500 characters
            </Text>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <MaterialIcons name="info-outline" size={20} color="#3182CE" />
              <Text style={styles.infoText}>
                All fields marked with * are required. You can update your profile anytime later.
              </Text>
            </View>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSetupProfile}
              loading={loading}
              disabled={loading || uploadingImage || !fullName.trim() || !mobileNumber.trim() || !village.trim()}
              style={[
                styles.setupButton,
                (!fullName.trim() || !mobileNumber.trim() || !village.trim()) && styles.setupButtonDisabled
              ]}
              contentStyle={styles.setupButtonContent}
              labelStyle={styles.setupButtonLabel}
              icon={({ size, color }) => (
                <MaterialIcons name="check-circle" size={size} color={color} />
              )}
            >
              {loading ? 'Creating Profile...' : 'Complete Setup'}
            </Button>

            {/* Privacy Note */}
            <Text style={styles.privacyNote}>
              By completing your profile, you agree to share this information with other users on the platform.
            </Text>
          </Card.Content>
        </Card>

        {/* Bottom spacing for better scroll */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40,
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
    paddingHorizontal: 20,
  },
  formCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    color: '#2D3748',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#6DD5A5',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  imagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E0',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 13,
    color: '#718096',
    fontWeight: '600',
  },
  imageSubtext: {
    marginTop: 4,
    fontSize: 11,
    color: '#A0AEC0',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 24,
  },
  input: {
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  bioInput: {
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  inputOutline: {
    borderRadius: 12,
    borderColor: '#E2E8F0',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 12,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'right',
    marginBottom: 20,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3182CE',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#2C5282',
    fontSize: 13,
    lineHeight: 18,
  },
  setupButton: {
    borderRadius: 12,
    backgroundColor: '#6DD5A5',
    elevation: 2,
    shadowColor: '#6DD5A5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginBottom: 16,
  },
  setupButtonDisabled: {
    backgroundColor: '#CBD5E0',
    elevation: 0,
  },
  setupButtonContent: {
    paddingVertical: 10,
  },
  setupButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  privacyNote: {
    fontSize: 11,
    color: '#A0AEC0',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  bottomSpacing: {
    height: 40,
  },
});