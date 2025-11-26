// Top-level imports (add formatDateForInput)
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, TextInput, Button, Card, Menu, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { uploadEquipmentImages } from '@/hooks/useImageUpload';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatDateForInput } from '@/utils/dateHelpers';

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

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const equipmentTypes = ['Tractor', 'Water Pump', 'Thresher', 'Harvester', 'Plough', 'Other'];

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

  const addEquipment = async () => {
    if (!user) {
      Alert.alert('Login required', 'Please log in to add equipment.');
      return;
    }

    // Basic validations
    if (!name.trim() || !equipmentType.trim() || !description.trim() || !location.trim()) {
      Alert.alert('Missing data', 'Please fill all required fields (Name, Type, Description, Location).');
      return;
    }
    const price = parseFloat(rentalPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid price', 'Please enter a valid rental price greater than 0.');
      return;
    }
    if (!['per_hour', 'per_day'].includes(priceType)) {
      Alert.alert('Invalid price type', 'Price type must be per_hour or per_day.');
      return;
    }
    const start = new Date(availabilityStart);
    const end = new Date(availabilityEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      Alert.alert('Invalid dates', 'Please enter valid dates in YYYY-MM-DD format.');
      return;
    }
    if (start > end) {
      Alert.alert('Invalid period', 'Available From must be before Available Until.');
      return;
    }

    setLoading(true);
    try {
      // Upload images if any
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
          rental_price: price,
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
          Add Equipment for Rent
        </Text>
      </View>

      <Card style={styles.formCard}>
        <Card.Content>
          <TextInput
            mode="outlined"
            label="Equipment Name *"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="e.g., John Deere Tractor"
          />

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TextInput
                mode="outlined"
                label="Equipment Type *"
                value={equipmentType}
                style={styles.input}
                right={<TextInput.Icon icon="chevron-down" onPress={() => setMenuVisible(true)} />}
                editable={false}
              />
            }
          >
            {equipmentTypes.map(type => (
              <Menu.Item
                key={type}
                onPress={() => {
                  setEquipmentType(type);
                  setMenuVisible(false);
                }}
                title={type}
              />
            ))}
          </Menu>

          <TextInput
            mode="outlined"
            label="Description *"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            multiline
            numberOfLines={4}
            placeholder="Describe the equipment condition, features, etc."
          />

          <View style={styles.priceSection}>
            <TextInput
              mode="outlined"
              label="Rental Price (₹) *"
              value={rentalPrice}
              onChangeText={setRentalPrice}
              style={[styles.input, styles.priceInput]}
              keyboardType="number-pad"
              placeholder="500"
            />
            
            <View style={styles.priceTypeButtons}>
              <Button
                mode={priceType === 'per_hour' ? 'contained' : 'outlined'}
                onPress={() => setPriceType('per_hour')}
                style={styles.priceTypeButton}
              >
                Per Hour
              </Button>
              <Button
                mode={priceType === 'per_day' ? 'contained' : 'outlined'}
                onPress={() => setPriceType('per_day')}
                style={styles.priceTypeButton}
              >
                Per Day
              </Button>
            </View>
          </View>

          <TextInput
            mode="outlined"
            label="Location *"
            value={location}
            onChangeText={setLocation}
            style={styles.input}
            placeholder="Village, District"
          />

          <View style={styles.dateSection}>
            <TextInput
              mode="outlined"
              label="Available From *"
              value={availabilityStart}
              style={[styles.input, styles.dateInput]}
              editable={false}
              placeholder="Select start date"
              right={<TextInput.Icon icon="calendar" onPress={() => setShowStartPicker(true)} />}
            />
            <TextInput
              mode="outlined"
              label="Available Until *"
              value={availabilityEnd}
              style={[styles.input, styles.dateInput]}
              editable={false}
              placeholder="Select end date"
              right={<TextInput.Icon icon="calendar" onPress={() => setShowEndPicker(true)} />}
            />
          </View>

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

          <Divider style={styles.divider} />

          <Button
            mode="outlined"
            icon="image"
            onPress={pickImages}
            loading={picking}
            style={styles.input}
          >
            Add Photos
          </Button>

          {selectedImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {selectedImages.map((uri) => (
                <View key={uri} style={{ marginRight: 8 }}>
                  <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 6 }} />
                </View>
              ))}
            </ScrollView>
          )}

          <Divider style={styles.divider} />

          <Button 
            mode="contained" 
            onPress={addEquipment}
            loading={loading}
            disabled={loading}
            style={styles.addButton}
            icon="plus"
          >
            Add Equipment
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
    padding: 20,
    paddingTop: 60,
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
    marginBottom: 15,
  },
  priceSection: {
    marginBottom: 15,
  },
  priceInput: {
    marginBottom: 10,
  },
  priceTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  priceTypeButton: {
    flex: 1,
  },
  dateSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
  },
  divider: {
    marginVertical: 20,
  },
  addButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 5,
  },
});