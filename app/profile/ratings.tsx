import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Divider, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Rating {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  rater: {
    full_name: string;
    village: string;
  };
  jobs: {
    title: string;
  };
}

export default function RatingsScreen() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRatings();
    }
  }, [user]);

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          rater:rater_id (full_name, village),
          jobs (title)
        `)
        .eq('rated_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRatings(data || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<MaterialIcons key={i} name="star" size={20} color="#ffc107" />);
    }
    
    if (hasHalfStar) {
      stars.push(<MaterialIcons key="half" name="star-half" size={20} color="#ffc107" />);
    }
    
    for (let i = stars.length; i < 5; i++) {
      stars.push(<MaterialIcons key={i} name="star-border" size={20} color="#ffc107" />);
    }
    
    return stars;
  };

  const onRefresh = () => {
    fetchRatings();
  };

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
          All My Ratings
        </Text>
      </View>

      <ScrollView 
        style={styles.ratingsList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {ratings.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="star-border" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Ratings Yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              Complete jobs to receive ratings from employers
            </Text>
          </View>
        ) : (
          <Card style={styles.ratingsCard}>
            <Card.Content>
              {ratings.map((rating, index) => (
                <View key={rating.id}>
                  <View style={styles.ratingItem}>
                    <View style={styles.ratingHeader}>
                      <View style={styles.ratingStars}>
                        {renderStars(rating.rating)}
                      </View>
                      <Text style={styles.ratingDate}>
                        {new Date(rating.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <Text style={styles.jobTitle}>
                      Job: {rating.jobs?.title}
                    </Text>
                    
                    {rating.comment && (
                      <Text style={styles.ratingComment}>
                        "{rating.comment}"
                      </Text>
                    )}
                    
                    <Text style={styles.ratingAuthor}>
                      - {rating.rater.full_name}, {rating.rater.village}
                    </Text>
                  </View>
                  
                  {index < ratings.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
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
  ratingsList: {
    flex: 1,
    padding: 15,
  },
  ratingsCard: {
    elevation: 2,
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
  },
  ratingItem: {
    paddingVertical: 15,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
  },
  ratingDate: {
    color: '#888',
    fontSize: 12,
  },
  jobTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingComment: {
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 20,
  },
  ratingAuthor: {
    color: '#666',
    fontSize: 12,
  },
  divider: {
    marginVertical: 5,
  },
});