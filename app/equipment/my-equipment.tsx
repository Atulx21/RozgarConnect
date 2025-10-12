import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, FAB } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function MyEquipmentScreen() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyEquipment();
    }
  }, [user]);

  const fetchMyEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          equipment_bookings (
            id,
            status,
            start_date,
            end_date,
            profiles:renter_id (full_name)
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Equipment table not found or error:', error.message);
        setEquipment([]);
        setLoading(false);
        return;
      }
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching my equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rented':
        return '#ff9800';
      case 'maintenance':
        return '#f44336';
      default:
        return '#4caf50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'rented':
        return 'Currently Rented';
      case 'maintenance':
        return 'Under Maintenance';
      default:
        return 'Available';
    }
  };

  const onRefresh = () => {
    fetchMyEquipment();
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="titleMedium">Please log in to view your equipment</Text>
        </View>
      </View>
    );
  }

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
          My Equipment
        </Text>
      </View>

      <ScrollView 
        style={styles.equipmentList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {equipment.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="build" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Equipment Listed
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              Start earning by listing your equipment for rent
            </Text>
            <Button 
              mode="contained" 
              onPress={() => router.push('/equipment/add')}
              style={styles.addFirstButton}
            >
              Add Your First Equipment
            </Button>
          </View>
        ) : (
          equipment.map((item) => (
            <Card key={item.id} style={styles.equipmentCard}>
              <Card.Content>
                <View style={styles.equipmentHeader}>
                  <Text variant="titleMedium" style={styles.equipmentName}>
                    {item.name}
                  </Text>
                  <Chip 
                    mode="outlined" 
                    textStyle={{ color: getStatusColor(item.status) }}
                    style={{ borderColor: getStatusColor(item.status) }}
                  >
                    {getStatusText(item.status)}
                  </Chip>
                </View>
                
                <Text variant="bodyMedium" style={styles.equipmentType}>
                  {item.equipment_type}
                </Text>
                
                <View style={styles.equipmentDetails}>
                  <Text style={styles.equipmentLocation}>📍 {item.location}</Text>
                  <Text style={styles.equipmentPrice}>
                    💰 ₹{item.rental_price} {item.price_type === 'per_hour' ? 'per hour' : 'per day'}
                  </Text>
                  <Text style={styles.equipmentBookings}>
                    📋 {item.equipment_bookings?.length || 0} booking requests
                  </Text>
                </View>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => router.push(`/equipment/${item.id}`)}>
                  View Details
                </Button>
                <Button onPress={() => router.push(`/equipment/${item.id}/bookings`)}>
                  Bookings ({item.equipment_bookings?.length || 0})
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/equipment/add')}
      />
    </View>
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
  equipmentList: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
    padding: 40,
  },
  emptyTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: '#666',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 20,
  },
  addFirstButton: {
    backgroundColor: '#4caf50',
  },
  equipmentCard: {
    marginBottom: 15,
    elevation: 2,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  equipmentName: {
    flex: 1,
    color: '#2e7d32',
    fontWeight: 'bold',
    marginRight: 10,
  },
  equipmentType: {
    color: '#666',
    marginBottom: 8,
  },
  equipmentDetails: {
    gap: 4,
  },
  equipmentLocation: {
    color: '#666',
  },
  equipmentPrice: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  equipmentBookings: {
    color: '#888',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4caf50',
  },
});