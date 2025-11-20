import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, Divider } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  full_name: string;
  village: string;
  role: 'worker' | 'provider';
  rating: number;
  total_ratings: number;
  created_at: string;
}

interface Rating {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  rater: {
    full_name: string;
    village: string;
  };
}

interface UserSkill {
  id: string;
  skill_name: string;
  is_verified: boolean;
  jobs_completed: number;
  average_rating: number;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const profileId = Array.isArray(id) ? id[0] : (id as string | undefined);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    fetchProfile();
    fetchRatings();
    fetchUserSkills();
  }, [profileId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          rater:rater_id (full_name, village)
        `)
        .eq('rated_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRatings(data || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', profileId)
        .order('is_verified', { ascending: false });

      if (error) {
        console.log('User skills table not found or error:', error.message);
        setSkills([]);
        return;
      }
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching user skills:', error);
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

  if (loading || !profile) {
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

      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text 
            size={80} 
            label={profile.full_name.charAt(0).toUpperCase()}
            style={styles.avatar}
          />
          <Text variant="headlineSmall" style={styles.name}>
            {profile.full_name}
          </Text>
          <Text variant="bodyLarge" style={styles.village}>
            📍 {profile.village}
          </Text>
          <Text variant="bodyMedium" style={styles.role}>
            {profile.role === 'worker' ? '👷‍♂️ Worker' : '🏢 Work Provider'}
          </Text>
          
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStars(profile.rating)}
            </View>
            <Text style={styles.ratingText}>
              {profile.rating.toFixed(1)} ({profile.total_ratings} reviews)
            </Text>
          </View>

          <Text style={styles.memberSince}>
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </Text>
        </Card.Content>
      </Card>

      {/* Skills Section - Only for Workers */}
      {profile.role === 'worker' && (
        <Card style={styles.skillsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Skills & Expertise
            </Text>
            <Divider style={styles.divider} />
            
            {skills.length === 0 ? (
              <View style={styles.emptySkills}>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No skills added yet
                </Text>
              </View>
            ) : (
              <View style={styles.skillsList}>
                {skills.map((skill) => (
                  <View key={skill.id} style={styles.skillItem}>
                    <View style={styles.skillHeader}>
                      <Text style={styles.skillName}>{skill.skill_name}</Text>
                      {skill.is_verified && (
                        <View style={styles.verifiedBadge}>
                          <MaterialIcons name="verified" size={16} color="#4caf50" />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.skillStats}>
                      {skill.jobs_completed} jobs completed
                      {skill.average_rating > 0 && ` • ${skill.average_rating.toFixed(1)}⭐ avg rating`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Ratings Section */}
      <Card style={styles.ratingsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Recent Reviews
          </Text>
          <Divider style={styles.divider} />
          
          {ratings.length === 0 ? (
            <View style={styles.emptyRatings}>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No reviews yet
              </Text>
            </View>
          ) : (
            ratings.map((rating) => (
              <View key={rating.id} style={styles.ratingItem}>
                <View style={styles.ratingHeader}>
                  <View style={styles.ratingStars}>
                    {renderStars(rating.rating)}
                  </View>
                  <Text style={styles.ratingDate}>
                    {new Date(rating.created_at).toLocaleDateString()}
                  </Text>
                </View>
                
                {rating.comment && (
                  <Text style={styles.ratingComment}>
                    "{rating.comment}"
                  </Text>
                )}
                
                <Text style={styles.ratingAuthor}>
                  - {rating.rater.full_name}, {rating.rater.village}
                </Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>
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
  profileCard: {
    margin: 15,
    elevation: 2,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    backgroundColor: '#4caf50',
    marginBottom: 15,
  },
  name: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  village: {
    color: '#666',
    marginBottom: 5,
  },
  role: {
    color: '#666',
    marginBottom: 15,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  ratingText: {
    color: '#666',
  },
  memberSince: {
    color: '#888',
    fontSize: 12,
  },
  ratingsCard: {
    margin: 15,
    elevation: 2,
  },
  sectionTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 15,
  },
  emptyRatings: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#999',
  },
  ratingItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  skillsCard: {
    margin: 15,
    elevation: 2,
  },
  emptySkills: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#999',
  },
  skillsList: {
    gap: 12,
  },
  skillItem: {
    paddingVertical: 8,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  skillName: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedText: {
    color: '#4caf50',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  skillStats: {
    color: '#666',
    fontSize: 12,
  },
});