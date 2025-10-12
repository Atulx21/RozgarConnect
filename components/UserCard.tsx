import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Avatar, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface User {
  id: string;
  full_name: string;
  village: string;
  role: 'worker' | 'provider';
  rating: number;
  total_ratings: number;
}

interface UserCardProps {
  user: User;
  showContactButton?: boolean;
}

export default function UserCard({ user, showContactButton = false }: UserCardProps) {
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

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.userInfo}>
          <Avatar.Text 
            size={50} 
            label={user.full_name.charAt(0).toUpperCase()}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text variant="titleMedium" style={styles.userName}>
              {user.full_name}
            </Text>
            <Text variant="bodyMedium" style={styles.userVillage}>
              📍 {user.village}
            </Text>
            <Text variant="bodyMedium" style={styles.userRole}>
              {user.role === 'worker' ? '👷‍♂️ Worker' : '🏢 Work Provider'}
            </Text>
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStars(user.rating)}
              </View>
              <Text style={styles.ratingText}>
                {user.rating.toFixed(1)} ({user.total_ratings} reviews)
              </Text>
            </View>
          </View>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => router.push(`/profile/${user.id}`)}>
          View Profile
        </Button>
        {showContactButton && (
          <Button mode="contained" style={styles.contactButton}>
            Contact
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#4caf50',
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#333',
    fontWeight: 'bold',
  },
  userVillage: {
    color: '#666',
    marginVertical: 4,
  },
  userRole: {
    color: '#666',
    marginBottom: 8,
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
  contactButton: {
    backgroundColor: '#4caf50',
  },
});