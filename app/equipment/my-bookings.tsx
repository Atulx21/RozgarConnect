import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
            equipment:equipment_id (id, name, equipment_type, owner_id),
            owner:equipment.owner_id (full_name)
          `)
          .eq('renter_id', user.id)
          .order('start_date', { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (e) {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('equipment_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('status', 'pending');

      if (error) throw error;
      setBookings((prev) => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch (e: any) {
      // Silently fail or show alert
    }
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