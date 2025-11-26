// Top-level imports (add formatDate import)
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, Card, Button, TextInput, Divider, Avatar } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatDateForInput } from '@/utils/dateHelpers'; // <-- keep this import and REMOVE local duplicate

// Add strong typing to fix "never" type errors
type PriceType = 'per_hour' | 'per_day';

interface OwnerProfile {
  full_name: string;
  village: string;
  rating: number;
  total_ratings: number;
}

interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  description: string;
  rental_price: number;
  price_type: PriceType;
  location: string;
  status: string;
  availability_start: string;
  availability_end: string;
  owner_id: string;
  created_at: string;
  photos?: string[]; // added to allow image display
  profiles: OwnerProfile;
}

export default function BookEquipmentScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hours, setHours] = useState(''); // for per_hour
  const [bookingLoading, setBookingLoading] = useState(false);
  const [estimatedTotal, setEstimatedTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Auto-sync endDate to startDate for per-hour rentals to reduce confusion
  useEffect(() => {
    if (equipment?.price_type === 'per_hour' && startDate) {
      setEndDate(startDate);
    }
  }, [equipment?.price_type, startDate]);

  const [booking, setBooking] = useState(false);

  const equipmentId = Array.isArray(id) ? id[0] : (id as string | undefined);
  useEffect(() => {
    if (!equipmentId) {
      setLoading(false);
      return;
    }
    fetchEquipmentDetails();
  }, [equipmentId]);

  // Remove calculateTotal useEffect; rely on estimatedTotal only
  const [totalAmount, setTotalAmount] = useState(0);

  // Recompute total estimate (used by the UI and booking validation)
  useEffect(() => {
    if (!equipment) return;
    const price = Number(equipment.rental_price);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (equipment.price_type === 'per_day') {
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        const msPerDay = 24 * 60 * 60 * 1000;
        const days = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
        setEstimatedTotal(days * price);
      } else {
        setEstimatedTotal(null);
      }
    } else {
      const h = Number(hours);
      if (h > 0) {
        setEstimatedTotal(h * price);
      } else {
        setEstimatedTotal(null);
      }
    }
  }, [equipment, startDate, endDate, hours]);

  const validateAndBook = async () => {
    if (!user || !equipment) {
      Alert.alert('Login required', 'Please log in to book equipment.');
      return;
    }

    // Prevent owner from booking their own equipment
    if (equipment.owner_id === user.id) {
      Alert.alert('Not allowed', 'You cannot book your own equipment.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      Alert.alert('Invalid dates', 'Please enter valid dates in YYYY-MM-DD format.');
      return;
    }
    if (start > end) {
      Alert.alert('Invalid period', 'Start date must be before end date.');
      return;
    }

    // Validate against availability window
    const availStart = new Date(equipment.availability_start);
    const availEnd = new Date(equipment.availability_end);
    if (start < availStart || end > availEnd) {
      Alert.alert(
        'Unavailable',
        `Selected dates must be within availability: ${availStart.toLocaleDateString()} - ${availEnd.toLocaleDateString()}`
      );
      return;
    }

    if (equipment.price_type === 'per_hour') {
      const h = Number(hours);
      if (!h || h <= 0) {
        Alert.alert('Invalid hours', 'Please enter the number of hours.');
        return;
      }
    }

    setBookingLoading(true);
    try {
      const { data: existing, error: existingError } = await supabase
        .from('equipment_bookings')
        .select('start_date, end_date, status')
        .eq('equipment_id', equipmentId)
        .in('status', ['approved', 'pending']);

      if (existingError) {
        throw new Error(existingError.message);
      }

      const hasOverlap = (existing || []).some((b) => {
        const bs = new Date(b.start_date);
        const be = new Date(b.end_date);
        return !(be < start || bs > end);
      });

      if (hasOverlap) {
        Alert.alert('Unavailable', 'Selected dates overlap with an existing booking.');
        setBookingLoading(false);
        return;
      }

      const totalAmountToInsert = estimatedTotal || 0;
      const { error } = await supabase
        .from('equipment_bookings')
        .insert({
          equipment_id: equipmentId,
          renter_id: user.id,
          start_date: startDate,
          end_date: endDate,
          total_amount: totalAmountToInsert,
          status: 'pending',
        });

      if (error) {
        Alert.alert(
          'Error',
          error.message.includes('equipment_no_overlap')
            ? 'Selected dates overlap with an existing booking.'
            : `Failed to create booking: ${error.message}`
        );
        setBookingLoading(false);
        return;
      }

      // Notify owner about new booking request (best-effort)
      if (equipment.owner_id) {
        const { error: notifErr } = await supabase
          .from('notifications')
          .insert({
            user_id: equipment.owner_id,
            title: 'New Equipment Booking Request',
            body: `You have a new booking request for ${equipment.name}.`,
            read: false,
          });
    
        if (notifErr) {
          console.warn('Notification insert failed', notifErr.message);
        }
      }

      Alert.alert('Booking request sent', 'The owner will review your booking.');
      // Route to My Equipment Bookings for clear confirmation
      router.push('/equipment/my-bookings');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const fetchEquipmentDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          profiles:owner_id (*)
        `)
        .eq('id', equipmentId)
        .single();

      if (error) throw error;
      setEquipment(data as Equipment);

      // Auto-set sensible default dates within availability window
      const eq = data as Equipment;
      const availStart = new Date(eq.availability_start);
      const availEnd = new Date(eq.availability_end);
      const today = new Date();

      // default start is the later of today or availability start
      const defaultStart = today < availStart ? availStart : today;
      // for per-hour, end equals start; for per-day, set end equal to start initially
      const defaultEnd = eq.price_type === 'per_hour' ? defaultStart : defaultStart;

      setStartDate(formatDateForInput(defaultStart));
      setEndDate(formatDateForInput(defaultEnd));
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

    // Extra validation for per-hour bookings
    if (equipment?.price_type === 'per_hour') {
      const h = parseFloat(hours);
      if (isNaN(h) || h <= 0) {
        Alert.alert('Error', 'Please enter valid hours for per-hour booking');
        return;
      }
    }

    setBooking(true);
    try {
      const { error } = await supabase.from('equipment_bookings').insert({
        equipment_id: equipmentId,
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

  // Compute primary image for booking screen
  const firstPhotoUrl = equipment?.photos?.[0]
    ? supabase.storage.from('equipment').getPublicUrl(equipment.photos[0]).data.publicUrl
    : null;

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

      {firstPhotoUrl && (
        <Image
          source={{ uri: firstPhotoUrl }}
          style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 12 }}
          resizeMode="cover"
        />
      )}

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
            Booking Details
          </Text>

          <View style={{ flexDirection: 'row' }}>
            <TextInput
              mode="outlined"
              label="Start Date"
              value={startDate}
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              editable={false}
              placeholder="Select start date"
              right={<TextInput.Icon icon="calendar" onPress={() => setShowStartPicker(true)} />}
            />
            <TextInput
              mode="outlined"
              label={equipment?.price_type === 'per_hour' ? 'End Date (auto)' : 'End Date'}
              value={endDate}
              style={[styles.input, { flex: 1 }]}
              editable={false}
              placeholder="Select end date"
              right={<TextInput.Icon icon="calendar" onPress={() => setShowEndPicker(true)} />}
            />
          </View>

          {/* Helpful hint to show availability window */}
          <Text style={{ color: '#666', marginBottom: 8 }}>
            Available between {new Date(equipment.availability_start).toLocaleDateString()} and {new Date(equipment.availability_end).toLocaleDateString()}
          </Text>

          {showStartPicker && (
            <DateTimePicker
              value={startDate ? new Date(startDate) : new Date()}
              mode="date"
              display="calendar"
              onChange={(event: DateTimePickerEvent, date?: Date) => {
                setShowStartPicker(false);
                if (event.type === 'set' && date) {
                  const selected = formatDateForInput(date);
                  setStartDate(selected);
                  // auto-sync for per-hour
                  if (equipment?.price_type === 'per_hour') {
                    setEndDate(selected);
                  }
                }
              }}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endDate ? new Date(endDate) : new Date()}
              mode="date"
              display="calendar"
              onChange={(event: DateTimePickerEvent, date?: Date) => {
                setShowEndPicker(false);
                if (event.type === 'set' && date) {
                  setEndDate(formatDateForInput(date));
                }
              }}
            />
          )}

          {/* Hours input, divider, totals, and buttons remain unchanged */}
          {equipment?.price_type === 'per_hour' && (
            <TextInput
              mode="outlined"
              label="Hours *"
              value={hours}
              onChangeText={setHours}
              keyboardType="numeric"
              style={styles.input}
            />
          )}

          <Divider style={styles.divider} />

          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>
              Estimated Total: {estimatedTotal != null ? `₹${estimatedTotal}` : '—'}
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={validateAndBook}
            loading={bookingLoading}
            disabled={bookingLoading}
            style={styles.bookButton}
            icon="calendar"
          >
            Request Booking
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

// At the bottom of the file, keep styles and REMOVE the duplicate local formatDate
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
  },
  equipmentType: {
    color: '#666',
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
    marginBottom: 12,
  },
  divider: {
    marginVertical: 20,
  },
  totalContainer: {
    paddingVertical: 8,
  },
  totalText: {
    fontWeight: 'bold',
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
    fontSize: 12,
  },
});