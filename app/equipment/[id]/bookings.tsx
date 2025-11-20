import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, Divider } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function EquipmentBookingsScreen() {
  const { id } = useLocalSearchParams();
  const equipmentId = Array.isArray(id) ? id[0] : (id as string | undefined);
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!equipmentId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    refetch();

    // Real-time subscription to bookings for this equipment
    const channel = supabase
      .channel(`equipment_bookings_${equipmentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment_bookings',
          filter: `equipment_id=eq.${equipmentId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [equipmentId]);

  const refetch = async () => {
    if (!equipmentId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipment_bookings')
        .select('id, start_date, end_date, total_amount, status, renter_id, profiles:renter_id (full_name)')
        .eq('equipment_id', equipmentId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (e) {
      console.error('Error fetching bookings:', e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const approveBooking = async (booking: any) => {
    try {
      // Ensure only owner can approve
      if (!user || !ownerId || user.id !== ownerId) {
        Alert.alert('Not allowed', 'Only the equipment owner can approve bookings.');
        return;
      }
      // Check overlap vs approved bookings
      const { data: approved } = await supabase
        .from('equipment_bookings')
        .select('start_date, end_date')
        .eq('equipment_id', equipmentId)
        .eq('status', 'approved');

      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);
      const hasOverlap = (approved || []).some((b) => {
        const bs = new Date(b.start_date);
        const be = new Date(b.end_date);
        return !(be < start || bs > end);
      });
      if (hasOverlap) {
        Alert.alert('Overlap detected', 'This booking overlaps with an approved booking.');
        return;
      }

      const { error } = await supabase
        .from('equipment_bookings')
        .update({ status: 'approved' })
        .eq('id', booking.id);

      if (error) throw error;

      // Notify renter (best-effort)
      await supabase.from('notifications').insert({
        user_id: booking.renter_id,
        title: 'Booking Approved',
        body: 'Your equipment booking request has been approved.',
        read: false,
      }).catch(() => {});

      Alert.alert('Approved', 'Booking approved successfully.');
      await refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to approve booking.');
    }
  };

  const rejectBooking = async (booking: any) => {
    try {
      if (!user || !ownerId || user.id !== ownerId) {
        Alert.alert('Not allowed', 'Only the equipment owner can reject bookings.');
        return;
      }

      const { error } = await supabase
        .from('equipment_bookings')
        .update({ status: 'rejected' })
        .eq('id', booking.id);

      if (error) throw error;

      // Notify renter (best-effort)
      await supabase.from('notifications').insert({
        user_id: booking.renter_id,
        title: 'Booking Rejected',
        body: 'Your equipment booking request has been rejected.',
        read: false,
      }).catch(() => {});

      Alert.alert('Rejected', 'Booking rejected.');
      await refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reject booking.');
    }
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()} icon="arrow-left" style={styles.backButton}>
          Back
        </Button>
        <Text variant="headlineSmall" style={styles.title}>Bookings</Text>
      </View>

      {loading ? (
        <Text style={{ padding: 16 }}>Loading...</Text>
      ) : bookings.length === 0 ? (
        <Text style={{ padding: 16 }}>No bookings yet.</Text>
      ) : (
        bookings.map((b) => (
          <Card key={b.id} style={styles.bookingCard}>
            <Card.Content>
              <View style={styles.headerRow}>
                <Text variant="titleMedium">
                  {new Date(b.start_date).toLocaleDateString()} — {new Date(b.end_date).toLocaleDateString()}
                </Text>
                <Chip>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</Chip>
              </View>

              <Text style={{ marginTop: 8 }}>Renter: {b.profiles?.full_name || 'Unknown'}</Text>
              
              <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                <Button
                  mode="outlined"
                  icon="message"
                  onPress={() => router.push(`/equipment/${equipmentId}/chat?recipientId=${b.renter_id}`)}
                >
                  Message Renter
                </Button>

                {user?.id === ownerId && b.status === 'pending' && (
                  <>
                    <Button
                      mode="contained"
                      onPress={() => approveBooking(b)}
                      style={{ backgroundColor: '#4caf50' }}
                    >
                      Approve
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => rejectBooking(b)}
                    >
                      Reject
                    </Button>
                  </>
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
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton: { alignSelf: 'flex-start', marginBottom: 10 },
  title: { color: '#2e7d32', fontWeight: 'bold' },
  bookingCard: { marginHorizontal: 15, marginBottom: 15, elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
});