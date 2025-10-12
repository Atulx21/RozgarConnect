import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Divider, Avatar } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function BookEquipmentScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [equipment, setEquipment] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchEquipmentDetails();
  }, [id]);

  useEffect(() => {
    calculateTotal();
  }, [startDate, endDate, equipment]);

  const fetchEquipmentDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          profiles:owner_id (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setEquipment(data);
    } catch (error) {
      console.error('Error fetching equipment details:', error);
      Alert.alert('Error', 'Failed to load equipment details');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!startDate || !endDate || !equipment) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      setTotalAmount(0);
      return;
    }

    if (equipment.price_type === 'per_day') {
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      setTotalAmount(days * equipment.rental_price);
    } else {
      const hours = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) * 24; // Convert days to hours for hourly rate
      setTotalAmount(hours * equipment.rental_price);
    }
  };

  const submitBooking = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select start and end dates');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    setBooking(true);
    try {
      const { error } = await supabase.from('equipment_bookings').insert({
        equipment_id: id,
        renter_id: user.id,
        start_date: startDate,
        end_date: endDate,
        total_amount: totalAmount,
        status: 'pending'
      });

      if (error) throw error;

      Alert.alert('Success', 'Booking request sent successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking request');
    } finally {
      setBooking(false);
    }
  };

  if (loading || !equipment) {
    return (
      <View style={styles.container}>
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
            Loading...
          </Text>
        </View>
      </View>
    );
  }

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
          Book Equipment
        </Text>
      </View>

      <Card style={styles.equipmentCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.equipmentName}>
            {equipment.name}
          </Text>
          <Text variant="bodyMedium" style={styles.equipmentType}>
            {equipment.equipment_type}
          </Text>
          <Text variant="bodyMedium" style={styles.equipmentPrice}>
            💰 ₹{equipment.rental_price} {equipment.price_type === 'per_hour' ? 'per hour' : 'per day'}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.bookingCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Select Rental Period
          </Text>
          
          <TextInput
            mode="outlined"
            label="Start Date (YYYY-MM-DD)"
            value={startDate}
            onChangeText={setStartDate}
            style={styles.input}
            placeholder="2025-01-20"
          />
          
          <TextInput
            mode="outlined"
            label="End Date (YYYY-MM-DD)"
            value={endDate}
            onChangeText={setEndDate}
            style={styles.input}
            placeholder="2025-01-22"
          />

          {totalAmount > 0 && (
            <View style={styles.totalContainer}>
              <Divider style={styles.divider} />
              <Text variant="titleMedium" style={styles.totalText}>
                Total Amount: ₹{totalAmount}
              </Text>
            </View>
          )}

          <Button 
            mode="contained" 
            onPress={submitBooking}
            loading={booking}
            disabled={booking || totalAmount <= 0}
            style={styles.bookButton}
            icon="calendar-check"
          >
            Send Booking Request
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.ownerCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Equipment Owner
          </Text>
          
          <View style={styles.ownerInfo}>
            <Avatar.Text 
              size={50} 
              label={equipment.profiles.full_name.charAt(0).toUpperCase()}
              style={styles.ownerAvatar}
            />
            <View style={styles.ownerDetails}>
              <Text variant="titleMedium" style={styles.ownerName}>
                {equipment.profiles.full_name}
              </Text>
              <Text variant="bodyMedium" style={styles.ownerVillage}>
                📍 {equipment.profiles.village}
              </Text>
              <Text variant="bodyMedium" style={styles.ownerRating}>
                ⭐ {equipment.profiles.rating.toFixed(1)} ({equipment.profiles.total_ratings} reviews)
              </Text>
            </View>
          </View>
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
  equipmentCard: {
    margin: 15,
    elevation: 2,
  },
  equipmentName: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  equipmentType: {
    color: '#666',
    marginBottom: 4,
  },
  equipmentPrice: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  bookingCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    marginBottom: 15,
  },
  totalContainer: {
    marginTop: 10,
  },
  divider: {
    marginBottom: 15,
  },
  totalText: {
    color: '#4caf50',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  bookButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 5,
  },
  ownerCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerAvatar: {
    backgroundColor: '#4caf50',
    marginRight: 15,
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    color: '#333',
    fontWeight: 'bold',
  },
  ownerVillage: {
    color: '#666',
    marginVertical: 4,
  },
  ownerRating: {
    color: '#666',
  },
});