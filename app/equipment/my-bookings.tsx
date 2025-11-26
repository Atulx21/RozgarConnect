import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, Button, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function MyEquipmentBookingsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from('equipment_bookings')
          .select(`
            *,
            equipment:equipment_id (id, name, equipment_type, owner_id, photos)
          `)
          .eq('renter_id', user.id)
          .order('start_date', { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (e) {
        setBookings([]);
        Alert.alert('Error', 'Failed to load bookings.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  // Add cancel booking feature to avoid undefined function error
  const cancelBooking = (bookingId: string | number) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this request?', [
      { text: 'No' },
      {
        text: 'Yes',
        onPress: async () => {
          const { error } = await supabase
            .from('equipment_bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

          if (error) {
            Alert.alert('Error', 'Failed to cancel booking.');
            return;
          }

          // Update local state so the UI reflects the change immediately
          setBookings((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
          );
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()} icon="arrow-left" style={styles.backButton}>
          Back
        </Button>
        <Text variant="headlineSmall" style={styles.title}>My Equipment Bookings</Text>
      </View>

      {loading ? (
        <Text style={{ padding: 16 }}>Loading...</Text>
      ) : bookings.length === 0 ? (
        <Text style={{ padding: 16 }}>You don't have any bookings yet.</Text>
      ) : (
        bookings.map((b) => (
          <Card key={b.id} style={styles.bookingCard}>
            <Card.Content>
              {b.equipment?.photos?.[0] && (
                <Image
                  source={{ uri: supabase.storage.from('equipment').getPublicUrl(b.equipment.photos[0]).data.publicUrl }}
                  style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 12 }}
                  resizeMode="cover"
                />
              )}
              <View style={styles.headerRow}>
                <Text variant="titleMedium">{b.equipment?.name || 'Equipment'}</Text>
                <Chip>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</Chip>
              </View>
              <Text>Type: {b.equipment?.equipment_type}</Text>
              <Text>Start: {new Date(b.start_date).toLocaleDateString()}</Text>
              <Text>End: {new Date(b.end_date).toLocaleDateString()}</Text>
              <Text>Total: ₹{b.total_amount ?? 0}</Text>

              <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                {b.equipment?.id && b.equipment?.owner_id && (
                  <Button
                    mode="outlined"
                    icon="message"
                    onPress={() => router.push(`/equipment/${b.equipment.id}/chat?recipientId=${b.equipment.owner_id}`)}
                  >
                    Message Owner
                  </Button>
                )}
                {b.status === 'pending' && (
                  <Button mode="outlined" onPress={() => cancelBooking(b.id)}>
                    Cancel Request
                  </Button>
                )}
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { alignSelf: 'flex-start', marginBottom: 10 },
  title: { color: '#2e7d32', fontWeight: 'bold' },
  bookingCard: { margin: 15, elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});