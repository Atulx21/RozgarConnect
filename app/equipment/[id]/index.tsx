import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, Divider, Avatar } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function EquipmentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user, profile } = useAuth();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipmentDetails();
  }, [id]);

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

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<MaterialIcons key={i} name="star" size={16} color="#ffc107" />);
    }
    
    if (hasHalfStar) {
      stars.push(<MaterialIcons key="half" name="star-half" size={16} color="#ffc107" />);
    }
    
    for (let i = stars.length; i < 5; i++) {
      stars.push(<MaterialIcons key={i} name="star-border" size={16} color="#ffc107" />);
    }
    
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  if (!equipment) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Equipment not found
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
      </View>

      {/* Equipment Details Card */}
      <Card style={styles.equipmentCard}>
        <Card.Content>
          <View style={styles.equipmentHeader}>
            <Text variant="headlineSmall" style={styles.equipmentName}>
              {equipment.name}
            </Text>
            <Chip mode="outlined">{equipment.equipment_type}</Chip>
          </View>

          <Text variant="bodyLarge" style={styles.description}>
            {equipment.description}
          </Text>

          <Divider style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <MaterialIcons name="location-on" size={20} color="#666" />
              <Text style={styles.detailText}>{equipment.location}</Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="attach-money" size={20} color="#4caf50" />
              <Text style={[styles.detailText, styles.priceText]}>
                ₹{equipment.rental_price} {equipment.price_type === 'per_hour' ? 'per hour' : 'per day'}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="date-range" size={20} color="#666" />
              <Text style={styles.detailText}>
                Available: {new Date(equipment.availability_start).toLocaleDateString()} - {new Date(equipment.availability_end).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="info" size={20} color="#666" />
              <Text style={styles.detailText}>
                Status: {equipment.status.charAt(0).toUpperCase() + equipment.status.slice(1)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Owner Details Card */}
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
              <View style={styles.ratingContainer}>
                <View style={styles.stars}>
                  {renderStars(equipment.profiles.rating)}
                </View>
                <Text style={styles.ratingText}>
                  {equipment.profiles.rating.toFixed(1)} ({equipment.profiles.total_ratings} reviews)
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      {equipment.owner_id !== user?.id && equipment.status === 'available' && (
        <View style={styles.actionsContainer}>
          <Button 
            mode="contained" 
            onPress={() => router.push(`/equipment/${equipment.id}/book`)}
            style={styles.bookButton}
            icon="calendar"
          >
            Book This Equipment
          </Button>
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
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  title: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  equipmentCard: {
    margin: 15,
    elevation: 2,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  equipmentName: {
    flex: 1,
    color: '#2e7d32',
    fontWeight: 'bold',
    marginRight: 15,
  },
  description: {
    color: '#333',
    lineHeight: 24,
  },
  divider: {
    marginVertical: 20,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    color: '#666',
    fontSize: 16,
  },
  priceText: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  ownerCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 15,
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
  },
  ratingText: {
    color: '#666',
    fontSize: 12,
  },
  actionsContainer: {
    padding: 15,
  },
  bookButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 5,
  },
});