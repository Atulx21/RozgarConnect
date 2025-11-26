import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  description: string;
  rental_price: number;
  price_type: 'per_hour' | 'per_day';
  location: string;
  status: string;
  availability_start: string;
  availability_end: string;
  profiles?: {
    full_name: string;
    village: string;
    rating: number;
  };
  photos?: string[]; // added to show images
}

interface EquipmentCardProps {
  equipment: Equipment;
  showBookButton?: boolean;
}

export default function EquipmentCard({ equipment, showBookButton = false }: EquipmentCardProps) {
  const handleViewDetails = () => {
    router.push(`/equipment/${equipment.id}`);
  };

  const handleBook = () => {
    router.push(`/equipment/${equipment.id}/book`);
  };

  const firstPhotoUrl = equipment.photos?.[0]
    ? supabase.storage.from('equipment').getPublicUrl(equipment.photos[0]).data.publicUrl
    : null;

  return (
    <Card style={styles.card}>
      <Card.Content>
        {firstPhotoUrl && (
          <Image
            source={{ uri: firstPhotoUrl }}
            style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 12 }}
            resizeMode="cover"
          />
        )}
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            {equipment.name}
          </Text>
          <Chip mode="outlined" compact>
            {equipment.equipment_type}
          </Chip>
        </View>
        
        <Text variant="bodyMedium" style={styles.description}>
          {equipment.description.length > 100 
            ? `${equipment.description.substring(0, 100)}...` 
            : equipment.description}
        </Text>
        
        <View style={styles.details}>
          <Text style={styles.location}>📍 {equipment.location}</Text>
          <Text style={styles.price}>
            💰 ₹{equipment.rental_price} {equipment.price_type === 'per_hour' ? 'per hour' : 'per day'}
          </Text>
          <Text style={styles.availability}>
            📅 Available: {new Date(equipment.availability_start).toLocaleDateString()} - {new Date(equipment.availability_end).toLocaleDateString()}
          </Text>
          {equipment.profiles && (
            <Text style={styles.owner}>
              Owner: {equipment.profiles.full_name} ({equipment.profiles.village})
              {equipment.profiles.rating > 0 && ` ⭐ ${equipment.profiles.rating.toFixed(1)}`}
            </Text>
          )}
        </View>
      </Card.Content>
      <Card.Actions>
        <Button onPress={handleViewDetails}>
          View Details
        </Button>
        {showBookButton && (
          <Button mode="contained" onPress={handleBook} style={styles.bookButton}>
            Book Now
          </Button>
        )}
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    color: '#2e7d32',
    fontWeight: 'bold',
    marginRight: 10,
  },
  description: {
    color: '#666',
    marginBottom: 12,
  },
  details: {
    gap: 4,
  },
  location: {
    color: '#666',
  },
  price: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  availability: {
    color: '#666',
  },
  owner: {
    color: '#888',
    fontSize: 12,
  },
  bookButton: {
    backgroundColor: '#4caf50',
  },
});