// Top-level imports
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, Pressable, Dimensions } from 'react-native';
import { Text, TextInput, Button, Card, Menu, Divider, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { uploadEquipmentImages } from '@/hooks/useImageUpload';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatDateForInput } from '@/utils/dateHelpers';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const COLORS = {
  primary: '#A78BFA',
  primaryDark: '#8B5CF6',
  secondary: '#6366F1',
  accent: '#EC4899',
  background: '#FAF5FF',
  surface: '#FFFFFF',
  border: 'rgba(167, 139, 250, 0.1)',
  text: '#1F2937',
  textSecondary: '#6B7280',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

const { height } = Dimensions.get('window');

export default function AddEquipmentScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [description, setDescription] = useState('');
  const [rentalPrice, setRentalPrice] = useState('');
  const [priceType, setPriceType] = useState<'per_hour' | 'per_day'>('per_day');
  const [location, setLocation] = useState('');
  const [availabilityStart, setAvailabilityStart] = useState('');
  const [availabilityEnd, setAvailabilityEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const equipmentTypes = ['Tractor', 'Water Pump', 'Thresher', 'Harvester', 'Plough', 'Other'];

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        return !value.trim() ? 'Equipment name is required' : '';
      case 'equipmentType':
        return !value.trim() ? 'Equipment type is required' : '';
      case 'description':
        return !value.trim() ? 'Description is required' : '';
      case 'location':
        return !value.trim() ? 'Location is required' : '';
      case 'rentalPrice':
        const price = parseFloat(value);
        if (isNaN(price)) return 'Price must be a number';
        if (price <= 0) return 'Price must be greater than 0';
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));

    switch (field) {
      case 'name':
        setName(value);
        break;
      case 'equipmentType':
        setEquipmentType(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'rentalPrice':
        setRentalPrice(value);
        break;
      case 'location':
        setLocation(value);
        break;
    }
  };

  const pickImages = async () => {
    try {
      setPicking(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow photo library access to upload equipment images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uris = result.assets.map(a => a.uri);
        setSelectedImages(prev => [...prev, ...uris]);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick images');
    } finally {
      setPicking(false);
    }
  };

  const removeImage = (uri: string) => {
    setSelectedImages(prev => prev.filter(u => u !== uri));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Equipment name is required';
    if (!equipmentType.trim()) newErrors.equipmentType = 'Equipment type is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!location.trim()) newErrors.location = 'Location is required';

    const price = parseFloat(rentalPrice);
    if (isNaN(price) || price <= 0) newErrors.rentalPrice = 'Valid price is required';

    const start = new Date(availabilityStart);
    const end = new Date(availabilityEnd);
    if (isNaN(start.getTime())) newErrors.availabilityStart = 'Start date is required';
    if (isNaN(end.getTime())) newErrors.availabilityEnd = 'End date is required';
    if (start > end) newErrors.availabilityEnd = 'End date must be after start date';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addEquipment = async () => {
    if (!user) {
      Alert.alert('Login required', 'Please log in to add equipment.');
      return;
    }

    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix all errors before submitting.');
      return;
    }

    setLoading(true);
    try {
      let photoPaths: string[] = [];
      if (selectedImages.length > 0) {
        const { paths } = await uploadEquipmentImages(selectedImages, user.id);
        photoPaths = paths;
      }

      const { error } = await supabase
        .from('equipment')
        .insert({
          owner_id: user.id,
          equipment_type: equipmentType,
          name,
          description,
          photos: photoPaths,
          rental_price: parseFloat(rentalPrice),
          price_type: priceType,
          availability_start: availabilityStart,
          availability_end: availabilityEnd,
          location,
          status: 'available',
        });

      if (error) {
        Alert.alert('Error', `Failed to add equipment: ${error.message}`);
        return;
      }

      Alert.alert('Success', 'Your equipment has been listed for rent.');
      router.push('/equipment/my-equipment');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to add equipment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background with Gradient */}
      <LinearGradient
        colors={['#FAF5FF', '#F3E8FF', '#EDE9FE']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Decorative Blur Circles */}
      <View style={[styles.blurCircle, styles.blurCircle1]} />
      <View style={[styles.blurCircle, styles.blurCircle2]} />
      <View style={[styles.blurCircle, styles.blurCircle3]} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Modern Header with Gradient */}
        <BlurView intensity={20} tint="light" style={styles.headerContainer}>
          <LinearGradient
            colors={['rgba(167, 139, 250, 0.1)', 'rgba(139, 92, 246, 0.05)']}
            style={styles.headerGradient}
          >
            <View style={styles.headerTop}>
              <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
              </Pressable>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>List Equipment</Text>
                <Text style={styles.headerSubtitle}>Start earning by renting out</Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressBar}
          />
        </View>

        {/* Section: Basic Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <MaterialCommunityIcons name="information" size={20} color={COLORS.surface} />
            </View>
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          <BlurView intensity={20} tint="light" style={styles.formCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <TextInput
                  mode="outlined"
                  label="Equipment Name"
                  value={name}
                  onChangeText={(val) => handleFieldChange('name', val)}
                  style={styles.input}
                  placeholder="e.g., John Deere Tractor"
                  outlineColor={errors.name ? COLORS.error : COLORS.border}
                  activeOutlineColor={errors.name ? COLORS.error : COLORS.primary}
                  left={<TextInput.Icon icon="tag" color={COLORS.primary} />}
                  placeholderTextColor={COLORS.textSecondary}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                    <Pressable onPress={() => setMenuVisible(true)}>
                      <TextInput
                        mode="outlined"
                        label="Equipment Type"
                        value={equipmentType}
                        style={styles.input}
                        editable={false}
                        outlineColor={errors.equipmentType ? COLORS.error : COLORS.border}
                        activeOutlineColor={COLORS.primary}
                        left={<TextInput.Icon icon="tractor" color={COLORS.primary} />}
                        right={<TextInput.Icon icon="chevron-down" />}
                        pointerEvents="none"
                      />
                    </Pressable>
                  }
                >
                  {equipmentTypes.map(type => (
                    <Menu.Item
                      key={type}
                      onPress={() => {
                        handleFieldChange('equipmentType', type);
                        setMenuVisible(false);
                      }}
                      title={type}
                    />
                  ))}
                </Menu>
                {errors.equipmentType && <Text style={styles.errorText}>{errors.equipmentType}</Text>}

                <TextInput
                  mode="outlined"
                  label="Description"
                  value={description}
                  onChangeText={(val) => handleFieldChange('description', val)}
                  style={[styles.input, styles.descriptionInput]}
                  multiline
                  numberOfLines={4}
                  placeholder="Describe condition, features, capacity..."
                  outlineColor={errors.description ? COLORS.error : COLORS.border}
                  activeOutlineColor={errors.description ? COLORS.error : COLORS.primary}
                  left={<TextInput.Icon icon="file-document" color={COLORS.primary} />}
                  placeholderTextColor={COLORS.textSecondary}
                />
                {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

                <TextInput
                  mode="outlined"
                  label="Location"
                  value={location}
                  onChangeText={(val) => handleFieldChange('location', val)}
                  style={styles.input}
                  placeholder="Village, District, State"
                  outlineColor={errors.location ? COLORS.error : COLORS.border}
                  activeOutlineColor={errors.location ? COLORS.error : COLORS.primary}
                  left={<TextInput.Icon icon="map-marker" color={COLORS.primary} />}
                  placeholderTextColor={COLORS.textSecondary}
                />
                {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Section: Pricing & Availability */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: COLORS.secondary }]}>
              <MaterialCommunityIcons name="currency-inr" size={20} color={COLORS.surface} />
            </View>
            <Text style={styles.sectionTitle}>Pricing & Availability</Text>
          </View>

          <BlurView intensity={20} tint="light" style={styles.formCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <TextInput
                  mode="outlined"
                  label="Rental Price (₹)"
                  value={rentalPrice}
                  onChangeText={(val) => handleFieldChange('rentalPrice', val)}
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="500"
                  outlineColor={errors.rentalPrice ? COLORS.error : COLORS.border}
                  activeOutlineColor={errors.rentalPrice ? COLORS.error : COLORS.secondary}
                  left={<TextInput.Icon icon="currency-inr" color={COLORS.secondary} />}
                  placeholderTextColor={COLORS.textSecondary}
                />
                {errors.rentalPrice && <Text style={styles.errorText}>{errors.rentalPrice}</Text>}

                <Text style={styles.priceTypeLabel}>Select Price Type</Text>
                <View style={styles.priceTypeContainer}>
                  <Pressable
                    style={[
                      styles.priceTypeButton,
                      priceType === 'per_hour' && styles.priceTypeButtonActive,
                    ]}
                    onPress={() => setPriceType('per_hour')}
                  >
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={20}
                      color={priceType === 'per_hour' ? COLORS.surface : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.priceTypeButtonText,
                        priceType === 'per_hour' && styles.priceTypeButtonTextActive,
                      ]}
                    >
                      Per Hour
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.priceTypeButton,
                      priceType === 'per_day' && styles.priceTypeButtonActive,
                    ]}
                    onPress={() => setPriceType('per_day')}
                  >
                    <MaterialCommunityIcons
                      name="calendar-outline"
                      size={20}
                      color={priceType === 'per_day' ? COLORS.surface : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.priceTypeButtonText,
                        priceType === 'per_day' && styles.priceTypeButtonTextActive,
                      ]}
                    >
                      Per Day
                    </Text>
                  </Pressable>
                </View>

                <Divider style={styles.divider} />

                <Text style={styles.availabilityLabel}>Equipment Availability Period</Text>
                <View style={styles.dateRow}>
                  <Pressable
                    style={styles.datePickerFlex}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <TextInput
                      mode="outlined"
                      label="Available From"
                      value={availabilityStart}
                      style={styles.dateInput}
                      editable={false}
                      outlineColor={errors.availabilityStart ? COLORS.error : COLORS.border}
                      activeOutlineColor={COLORS.primary}
                      left={<TextInput.Icon icon="calendar-start" color={COLORS.primary} />}
                      pointerEvents="none"
                    />
                  </Pressable>

                  <Pressable
                    style={styles.datePickerFlex}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <TextInput
                      mode="outlined"
                      label="Available Until"
                      value={availabilityEnd}
                      style={styles.dateInput}
                      editable={false}
                      outlineColor={errors.availabilityEnd ? COLORS.error : COLORS.border}
                      activeOutlineColor={COLORS.primary}
                      left={<TextInput.Icon icon="calendar-end" color={COLORS.primary} />}
                      pointerEvents="none"
                    />
                  </Pressable>
                </View>
                {errors.availabilityStart && <Text style={styles.errorText}>{errors.availabilityStart}</Text>}
                {errors.availabilityEnd && <Text style={styles.errorText}>{errors.availabilityEnd}</Text>}
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Date Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={availabilityStart ? new Date(availabilityStart) : new Date()}
            mode="date"
            display="calendar"
            onChange={(event: DateTimePickerEvent, date?: Date) => {
              setShowStartPicker(false);
              if (event.type === 'set' && date) {
                setAvailabilityStart(formatDateForInput(date));
              }
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={availabilityEnd ? new Date(availabilityEnd) : new Date()}
            mode="date"
            display="calendar"
            onChange={(event: DateTimePickerEvent, date?: Date) => {
              setShowEndPicker(false);
              if (event.type === 'set' && date) {
                setAvailabilityEnd(formatDateForInput(date));
              }
            }}
          />
        )}

        {/* Section: Equipment Photos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: COLORS.accent }]}>
              <MaterialCommunityIcons name="image-multiple" size={20} color={COLORS.surface} />
            </View>
            <Text style={styles.sectionTitle}>Equipment Photos</Text>
          </View>

          <BlurView intensity={20} tint="light" style={styles.formCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <Button
                  mode="outlined"
                  icon="image-plus"
                  onPress={pickImages}
                  loading={picking}
                  disabled={picking}
                  style={styles.photoButton}
                  contentStyle={styles.photoButtonContent}
                  textColor={COLORS.accent}
                  labelStyle={styles.photoButtonLabel}
                >
                  Add Photos
                </Button>
                <Text style={styles.photoHint}>Add up to 5 high-quality photos to attract more renters</Text>

                {selectedImages.length > 0 && (
                  <View style={styles.photosContainer}>
                    <View style={styles.photosHeader}>
                      <Text style={styles.photosCountText}>
                        {selectedImages.length} photo{selectedImages.length !== 1 ? 's' : ''} selected
                      </Text>
                      <Text style={styles.photosSizeHint}>Tap to remove</Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.photosScroll}
                    >
                      {selectedImages.map((uri, index) => (
                        <Pressable
                          key={uri}
                          onPress={() => removeImage(uri)}
                          style={styles.photoItemContainer}
                        >
                          <Image source={{ uri }} style={styles.photoThumbnail} />
                          <View style={styles.photoOverlay}>
                            <MaterialCommunityIcons name="delete" size={24} color={COLORS.surface} />
                          </View>
                          <View style={styles.photoIndex}>
                            <Text style={styles.photoIndexText}>{index + 1}</Text>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Submit Button Section */}
        <View style={styles.submitSection}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.submitButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Pressable
              onPress={addEquipment}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
              ]}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.surface} />
                  <Text style={styles.submitButtonText}>Adding Equipment...</Text>
                </View>
              ) : (
                <View style={styles.submitButtonContent}>
                  <MaterialCommunityIcons name="plus-circle" size={22} color={COLORS.surface} />
                  <Text style={styles.submitButtonText}>List Equipment for Rent</Text>
                </View>
              )}
            </Pressable>
          </LinearGradient>
          <Text style={styles.submitHint}>
            Once listed, your equipment will be visible to renters in your area
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    backgroundColor: 'rgba(167, 139, 250, 0.06)',
  },
  blurCircle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -80,
  },
  blurCircle2: {
    width: 250,
    height: 250,
    bottom: 150,
    left: -60,
  },
  blurCircle3: {
    width: 200,
    height: 200,
    top: height * 0.45,
    right: -40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 20,
  },
  headerContainer: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167, 139, 250, 0.15)',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  progressContainer: {
    height: 3,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  section: {
    marginTop: 28,
    marginHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  formCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardGradient: {
    borderRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  descriptionInput: {
    height: 100,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 12,
  },
  priceTypeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  priceTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  priceTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    gap: 8,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  priceTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  priceTypeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  priceTypeButtonTextActive: {
    color: COLORS.surface,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: COLORS.border,
  },
  availabilityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerFlex: {
    flex: 1,
  },
  dateInput: {
    marginBottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  photoButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.accent,
    marginBottom: 12,
  },
  photoButtonContent: {
    paddingVertical: 10,
  },
  photoButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  photoHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  photosContainer: {
    marginTop: 16,
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  photosCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  photosSizeHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  photosScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  photoItemContainer: {
    marginRight: 12,
    marginBottom: 12,
    position: 'relative',
  },
  photoThumbnail: {
    width: 110,
    height: 110,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  photoIndex: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  photoIndexText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  submitSection: {
    marginTop: 28,
    marginHorizontal: 20,
  },
  submitButtonGradient: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  submitButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  submitButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  submitHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});