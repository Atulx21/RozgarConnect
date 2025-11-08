import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  TouchableOpacity, 
  Image,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '@/hooks/useAuth';
import { validateMobileNumber, sanitizeInput } from '@/utils/validation';

export default function EditProfileScreen() {
  const { profile, user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setVillage(profile.village || '');
      setPhone(profile.mobile_number || profile.phone || '');
      setBio(profile.bio || '');
      setCurrentAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access photos');
        return;
      }

      setUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    if (!image?.base64) return currentAvatarUrl;

    try {
      const fileName = `profile-${user.id}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(fileName, decode(image.base64), {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) throw error;

      // Delete old avatar if exists and is different
      if (currentAvatarUrl && currentAvatarUrl !== fileName) {
        try {
          await supabase.storage
            .from('profiles')
            .remove([currentAvatarUrl]);
        } catch (deleteError) {
          console.log('Could not delete old avatar:', deleteError);
        }
      }

      return fileName;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Warning', 'Failed to upload image, but profile will be updated');
      return currentAvatarUrl;
    }
  };

  const handleSave = async () => {
    // Validation
    if (!fullName.trim() || !village.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (phone.trim() && !validateMobileNumber(phone.trim())) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please try logging in again.');
      return;
    }

    setLoading(true);
    try {
      // Upload image first if changed
      const imageUrl = await uploadImage();
      
      // Update profile in database
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: sanitizeInput(fullName),
        mobile_number: phone.trim().replace(/\s+/g, ''),
        village: sanitizeInput(village),
        bio: bio ? sanitizeInput(bio) : null,
        avatar_url: imageUrl,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Update auth context
      await updateProfile({
        full_name: fullName.trim(),
        village: village.trim(),
        mobile_number: phone.trim(),
        bio: bio.trim(),
        avatar_url: imageUrl,
      });

      Alert.alert('Success! 🎉', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getImageUri = () => {
    if (image) return image.uri;
    if (currentAvatarUrl) {
      return supabase.storage.from('profiles').getPublicUrl(currentAvatarUrl).data.publicUrl;
    }
    return null;
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
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#2D3748" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text variant="headlineMedium" style={styles.title}>
              Edit Profile
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Update your information
            </Text>
          </View>
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
              ) : getImageUri() ? (
                <View style={styles.imageWrapper}>
                  <Image 
                    source={{ uri: getImageUri() }} 
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
              label="Mobile Number"
              value={phone}
              onChangeText={setPhone}
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
              error={phone.length > 0 && !validateMobileNumber(phone)}
            />
            {phone.length > 0 && !validateMobileNumber(phone) && (
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

            {/* Role Display */}
            <View style={styles.roleBox}>
              <MaterialIcons 
                name={profile?.role === 'worker' ? 'engineering' : 'business'} 
                size={24} 
                color="#6DD5A5" 
              />
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleLabel}>Current Role</Text>
                <Text style={styles.roleText}>
                  {profile?.role === 'worker' ? '👷‍♂️ Worker' : '🏢 Work Provider'}
                </Text>
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <MaterialIcons name="info-outline" size={20} color="#3182CE" />
              <Text style={styles.infoText}>
                Fields marked with * are required. Your role cannot be changed.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => router.back()}
                disabled={loading || uploadingImage}
                style={styles.cancelButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.cancelButtonLabel}
              >
                Cancel
              </Button>

              <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                disabled={loading || uploadingImage || !fullName.trim() || !village.trim()}
                style={[
                  styles.saveButton,
                  (!fullName.trim() || !village.trim()) && styles.saveButtonDisabled
                ]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.saveButtonLabel}
                icon={({ size, color }) => (
                  <MaterialIcons name="check" size={size} color={color} />
                )}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Bottom spacing */}
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
    paddingBottom: 20,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: '#2D3748',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#718096',
  },
  formCard: {
    margin: 20,
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
  roleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F7EF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6DD5A5',
  },
  roleTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  roleLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '600',
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: '#CBD5E0',
    borderWidth: 1.5,
  },
  cancelButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A5568',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#6DD5A5',
    elevation: 2,
    shadowColor: '#6DD5A5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#CBD5E0',
    elevation: 0,
  },
  saveButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});