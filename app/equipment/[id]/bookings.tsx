import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Avatar, Chip } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    village: string;
    rating: number;
    total_ratings: number;
  };
}

export default function EquipmentBookingsScreen() {
  const { id } = useLocalSearchParams();
  const equipmentId = Array.isArray(id) ? id[0] : (id as string | undefined);
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!equipmentId) {
      setLoading(false);
      return;
    }
    fetchEquipmentAndBookings();
  }, [equipmentId]);

  const fetchEquipmentAndBookings = async () => {
    try {
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', equipmentId)
        .single();

      if (equipmentError) throw equipmentError;
      setEquipment(equipmentData);

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('equipment_bookings')
        .select(`
          *,
          profiles:renter_id (*)
        `)
        .eq('equipment_id', equipmentId)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.log('Equipment bookings table not found or error:', bookingsError.message);
        setBookings([]);
        setLoading(false);
        return;
      }
      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('equipment_bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      Alert.alert('Success', `Booking ${status} successfully!`);
      fetchEquipmentAndBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      Alert.alert('Error', 'Failed to update booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      case 'completed':
        return '#2196f3';
      default:
        return '#ff9800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      default:
        return 'Pending';
    }
  };

  if (loading) {
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
          Bookings for "{equipment?.name}"
        </Text>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="event-busy" size={64} color="#ccc" />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No Booking Requests
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Booking requests for your equipment will appear here
          </Text>
        </View>
      ) : (
        <View style={styles.bookingsList}>
          {bookings.map((booking) => (
            <Card key={booking.id} style={styles.bookingCard}>
              <Card.Content>
                <View style={styles.bookingHeader}>
                  <View style={styles.renterInfo}>
                    <Avatar.Text 
                      size={50} 
                      label={booking.profiles.full_name.charAt(0).toUpperCase()}
                      style={styles.avatar}
                    />
                    <View style={styles.renterDetails}>
                      <Text variant="titleMedium" style={styles.renterName}>
                        {booking.profiles.full_name}
                      </Text>
                      <Text variant="bodyMedium" style={styles.renterVillage}>
                        📍 {booking.profiles.village}
                      </Text>
                      <Text variant="bodyMedium" style={styles.renterRating}>
                        ⭐ {booking.profiles.rating.toFixed(1)} ({booking.profiles.total_ratings} reviews)
                      </Text>
                    </View>
                  </View>
                  <Chip 
                    mode="outlined" 
                    textStyle={{ color: getStatusColor(booking.status) }}
                    style={{ borderColor: getStatusColor(booking.status) }}
                  >
                    {getStatusText(booking.status)}
                  </Chip>
                </View>

                <View style={styles.bookingDetails}>
                  <Text style={styles.bookingDates}>
                    📅 {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.bookingAmount}>
                    💰 Total: ₹{booking.total_amount}
                  </Text>
                  <Text style={styles.bookingDate}>
                    Requested: {new Date(booking.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </Card.Content>

              <Card.Actions>
                <Button 
                  mode="text"
                  onPress={() => router.push(`/profile/${booking.profiles.id}`)}
                >
                  View Profile
                </Button>
                
                {booking.status === 'pending' && (
                  <>
                    <Button 
                      mode="contained"
                      onPress={() => updateBookingStatus(booking.id, 'approved')}
                      style={styles.approveButton}
                    >
                      Approve
                    </Button>
                    <Button 
                      mode="outlined"
                      onPress={() => updateBookingStatus(booking.id, 'rejected')}
                      textColor="#f44336"
                    >
                      Reject
                    </Button>
                  </>
                )}
                
                {booking.status === 'approved' && (
                  <Button 
                    mode="contained"
                    onPress={() => updateBookingStatus(booking.id, 'completed')}
                    style={styles.completeButton}
                  >
                    Mark Complete
                  </Button>
                )}
              </Card.Actions>
            </Card>
          ))}
        </View>
      )}
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: '#666',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#999',
  },
  bookingsList: {
    padding: 15,
  },
  bookingCard: {
    marginBottom: 15,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  renterInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 15,
  },
  avatar: {
    backgroundColor: '#4caf50',
    marginRight: 15,
  },
  renterDetails: {
    flex: 1,
  },
  renterName: {
    color: '#333',
    fontWeight: 'bold',
  },
  renterVillage: {
    color: '#666',
    marginVertical: 4,
  },
  renterRating: {
    color: '#666',
  },
  bookingDetails: {
    gap: 4,
  },
  bookingDates: {
    color: '#666',
    fontWeight: 'bold',
  },
  bookingAmount: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  bookingDate: {
    color: '#888',
    fontSize: 12,
  },
  approveButton: {
    backgroundColor: '#4caf50',
  },
  completeButton: {
    backgroundColor: '#2196f3',
  },
});