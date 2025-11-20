import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  TouchableOpacity, 
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions 
} from 'react-native';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '@/hooks/useAuth';
import { validateMobileNumber, sanitizeInput } from '@/utils/validation';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { height } = Dimensions.get('window');

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
      const imageUrl = await uploadImage();
      
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
      {/* Background */}
      <LinearGradient
        colors={['#F0FDF4', '#DCFCE7', '#E8F5E9']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Subtle Blurred Accent Circles */}
      <View style={[styles.blurCircle, styles.blurCircle1]} />
      <View style={[styles.blurCircle, styles.blurCircle2]} />
      <View style={[styles.blurCircle, styles.blurCircle3]} />

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
            <BlurView intensity={20} tint="light" style={styles.backButtonBlur}>
              <MaterialIcons name="arrow-back" size={24} color="#10B981" />
            </BlurView>
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

        {/* Profile Photo Section with Hybrid Design */}
        <View style={styles.photoSection}>
          <BlurView intensity={20} tint="light" style={styles.photoCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.photoCardGradient}
            >
              <View style={styles.imagePickerContainer}>
                {uploadingImage ? (
                  <View style={styles.imagePlaceholder}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.imagePlaceholderText}>Loading...</Text>
                  </View>
                ) : getImageUri() ? (
                  <View style={styles.imageWrapper}>
                    <Image 
                      source={{ uri: getImageUri() }} 
                      style={styles.profileImage} 
                      resizeMode="cover"
                    />
                    <TouchableOpacity 
                      onPress={pickImage}
                      style={styles.editIconButton}
                      activeOpacity={0.8}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.editIconGradient}
                      >
                        <MaterialIcons name="photo-camera" size={18} color="white" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    onPress={pickImage}
                    style={styles.imagePlaceholder}
                    activeOpacity={0.8}
                    disabled={loading}
                  >
                    <View style={styles.placeholderIcon}>
                      <MaterialIcons name="add-a-photo" size={32} color="#10B981" />
                    </View>
                    <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                    <Text style={styles.imagePlaceholderSubtext}>Tap to upload</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <Text style={styles.photoHint}>
                Upload a clear photo of yourself
              </Text>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Form Card with Hybrid Design */}
        <BlurView intensity={20} tint="light" style={styles.formCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
            style={styles.formCardGradient}
          >
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Basic Information
            </Text>

            {/* Full Name Input - Hybrid Style */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <MaterialIcons name="person" size={18} color="#10B981" />
                <Text style={styles.inputLabel}>Full Name *</Text>
              </View>
              <TextInput
                mode="outlined"
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
                outlineStyle={styles.inputOutline}
                activeOutlineColor="#10B981"
                textColor="#1F2937"
                placeholderTextColor="#9CA3AF"
                placeholder="Enter your full name"
                autoCapitalize="words"
                disabled={loading}
                error={fullName.length > 0 && fullName.trim().length < 2}
              />
              {fullName.length > 0 && fullName.trim().length < 2 && (
                <Text style={styles.errorText}>Name must be at least 2 characters</Text>
              )}
            </View>

            {/* Mobile Number Input - Hybrid Style */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <MaterialIcons name="phone" size={18} color="#10B981" />
                <Text style={styles.inputLabel}>Mobile Number</Text>
              </View>
              <TextInput
                mode="outlined"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={10}
                outlineStyle={styles.inputOutline}
                activeOutlineColor="#10B981"
                textColor="#1F2937"
                placeholderTextColor="#9CA3AF"
                placeholder="10-digit mobile number"
                disabled={loading}
                error={phone.length > 0 && !validateMobileNumber(phone)}
              />
              {phone.length > 0 && !validateMobileNumber(phone) && (
                <Text style={styles.errorText}>Please enter a valid 10-digit number</Text>
              )}
            </View>

            {/* Village Input - Hybrid Style */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <MaterialIcons name="location-on" size={18} color="#10B981" />
                <Text style={styles.inputLabel}>Village/Town *</Text>
              </View>
              <TextInput
                mode="outlined"
                value={village}
                onChangeText={setVillage}
                style={styles.input}
                outlineStyle={styles.inputOutline}
                activeOutlineColor="#10B981"
                textColor="#1F2937"
                placeholderTextColor="#9CA3AF"
                placeholder="Enter your village or town"
                autoCapitalize="words"
                disabled={loading}
              />
            </View>

            {/* Bio Input - Hybrid Style */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <MaterialIcons name="description" size={18} color="#10B981" />
                <Text style={styles.inputLabel}>Bio (Optional)</Text>
              </View>
              <TextInput
                mode="outlined"
                value={bio}
                onChangeText={setBio}
                style={[styles.input, styles.bioInput]}
                multiline
                numberOfLines={4}
                outlineStyle={styles.inputOutline}
                activeOutlineColor="#10B981"
                textColor="#1F2937"
                placeholderTextColor="#9CA3AF"
                placeholder="Tell others about your skills and experience"
                maxLength={500}
                disabled={loading}
              />
              <Text style={styles.characterCount}>
                {bio.length}/500 characters
              </Text>
            </View>

            {/* Role Display */}
            <BlurView intensity={15} tint="light" style={styles.roleBox}>
              <View style={styles.roleIconContainer}>
                <MaterialIcons 
                  name={profile?.role === 'worker' ? 'engineering' : 'business'} 
                  size={24} 
                  color="#10B981" 
                />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleLabel}>Current Role</Text>
                <Text style={styles.roleText}>
                  {profile?.role === 'worker' ? '👷‍♂️ Worker' : '🏢 Work Provider'}
                </Text>
              </View>
            </BlurView>

            {/* Info Box */}
            <BlurView intensity={15} tint="light" style={styles.infoBox}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="info-outline" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.infoText}>
                Fields marked with * are required. Your role cannot be changed.
              </Text>
            </BlurView>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => router.back()}
                disabled={loading || uploadingImage}
                style={[styles.cancelButtonWrapper, (loading || uploadingImage) && styles.buttonDisabled]}
                activeOpacity={0.8}
              >
                <BlurView intensity={20} tint="light" style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={loading || uploadingImage || !fullName.trim() || !village.trim()}
                style={[styles.saveButtonWrapper, (!fullName.trim() || !village.trim() || loading) && styles.buttonDisabled]}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.saveButton}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={20} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </BlurView>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    bottom: 200,
    left: -50,
  },
  blurCircle3: {
    width: 180,
    height: 180,
    top: height * 0.5,
    right: -30,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6B7280',
  },
  photoSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  photoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    elevation: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  photoCardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  imagePickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#10B981',
  },
  editIconButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  editIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  imagePlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 4,
  },
  imagePlaceholderSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  photoHint: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  formCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    elevation: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  formCardGradient: {
    padding: 24,
  },
  sectionTitle: {
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
  },
  inputOutline: {
    borderRadius: 12,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1.5,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 6,
  },
  roleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    overflow: 'hidden',
  },
  roleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  roleText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    overflow: 'hidden',
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  infoText: {
    flex: 1,
    color: '#1E40AF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButtonWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    minHeight: 56,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  saveButtonWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 56,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  bottomSpacing: {
    height: 20,
  },
});