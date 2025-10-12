import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Menu, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

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

  const equipmentTypes = ['Tractor', 'Water Pump', 'Thresher', 'Harvester', 'Plough', 'Other'];

  const addEquipment = async () => {
    if (!name || !equipmentType || !description || !rentalPrice || !location || !availabilityStart || !availabilityEnd) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to add equipment');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('equipment').insert({
        owner_id: user.id,
        name: name.trim(),
        equipment_type: equipmentType,
        description: description.trim(),
        rental_price: parseFloat(rentalPrice),
        price_type: priceType,
        location: location.trim(),
        availability_start: availabilityStart,
        availability_end: availabilityEnd,
        status: 'available'
      });

      if (error) throw error;

      Alert.alert('Success', 'Equipment added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding equipment:', error);
      Alert.alert('Error', 'Failed to add equipment');
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
              label="Available From (YYYY-MM-DD) *"
              value={availabilityStart}
              onChangeText={setAvailabilityStart}
              style={[styles.input, styles.dateInput]}
              placeholder="2025-01-20"
            />
            
            <TextInput
              mode="outlined"
              label="Available Until (YYYY-MM-DD) *"
              value={availabilityEnd}
              onChangeText={setAvailabilityEnd}
              style={[styles.input, styles.dateInput]}
              placeholder="2025-12-31"
            />
          </View>

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