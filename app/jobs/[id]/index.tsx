import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, Divider, Avatar } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Job {
  id: string;
  title: string;
  category: string;
  description: string;
  workers_needed: number;
  pay_amount: number;
  pay_type: 'per_day' | 'total';
  location: string;
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

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchJobDetails();
    if (user && profile?.role === 'worker') {
      checkApplicationStatus();
    }
  }, [id, user]);

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles:provider_id (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job details:', error);
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', id)
        .eq('worker_id', user.id)
        .single();

      if (data) {
        setHasApplied(true);
      }
    } catch (error) {
      // No application found, which is fine
    }
  };

  const applyForJob = async () => {
    if (!user || !job) return;

    setApplying(true);
    try {
      const { error } = await supabase.from('applications').insert({
        job_id: job.id,
        worker_id: user.id,
        status: 'pending'
      });

      if (error) throw error;

      setHasApplied(true);
      Alert.alert('Success', 'Application submitted successfully!');
    } catch (error) {
      console.error('Error applying for job:', error);
      Alert.alert('Error', 'Failed to submit application');
    } finally {
      setApplying(false);
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

  if (!job) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Job not found
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

      {/* Job Details Card */}
      <Card style={styles.jobCard}>
        <Card.Content>
          <View style={styles.jobHeader}>
            <Text variant="headlineSmall" style={styles.jobTitle}>
              {job.title}
            </Text>
            <Chip mode="outlined">{job.category}</Chip>
          </View>

          <Text variant="bodyLarge" style={styles.description}>
            {job.description}
          </Text>

          <Divider style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <MaterialIcons name="location-on" size={20} color="#666" />
              <Text style={styles.detailText}>{job.location}</Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="attach-money" size={20} color="#4caf50" />
              <Text style={[styles.detailText, styles.payText]}>
                ₹{job.pay_amount} {job.pay_type === 'per_day' ? 'per day' : 'total'}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="group" size={20} color="#666" />
              <Text style={styles.detailText}>
                {job.workers_needed} worker{job.workers_needed > 1 ? 's' : ''} needed
              </Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="schedule" size={20} color="#666" />
              <Text style={styles.detailText}>
                Posted: {new Date(job.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Provider Details Card */}
      <Card style={styles.providerCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Posted by
          </Text>
          
          <View style={styles.providerInfo}>
            <Avatar.Text 
              size={50} 
              label={job.profiles.full_name.charAt(0).toUpperCase()}
              style={styles.providerAvatar}
            />
            <View style={styles.providerDetails}>
              <Text variant="titleMedium" style={styles.providerName}>
                {job.profiles.full_name}
              </Text>
              <Text variant="bodyMedium" style={styles.providerVillage}>
                📍 {job.profiles.village}
              </Text>
              <View style={styles.ratingContainer}>
                <View style={styles.stars}>
                  {renderStars(job.profiles.rating)}
                </View>
                <Text style={styles.ratingText}>
                  {job.profiles.rating.toFixed(1)} ({job.profiles.total_ratings} reviews)
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      {profile?.role === 'worker' && job.status === 'open' && (
        <View style={styles.actionsContainer}>
          {hasApplied ? (
            <Card style={styles.appliedCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.appliedText}>
                  ✓ Application Submitted
                </Text>
                <Text variant="bodyMedium" style={styles.appliedSubtext}>
                  The employer will review your application
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <Button 
              mode="contained" 
              onPress={applyForJob}
              loading={applying}
              disabled={applying}
              style={styles.applyButton}
              icon="send"
            >
              Apply for this Job
            </Button>
          )}
        </View>
      )}

      {profile?.role === 'provider' && job.profiles.id === user?.id && (
        <View style={styles.actionsContainer}>
          <Button 
            mode="outlined" 
            onPress={() => router.push(`/jobs/${job.id}/applications`)}
            style={styles.actionButton}
            icon="account-group"
          >
            View Applications
          </Button>
          {job.status === 'in_progress' && (
            <Button 
              mode="contained" 
              onPress={() => router.push(`/jobs/${job.id}/complete`)}
              style={[styles.actionButton, styles.completeButton]}
              icon="check-circle"
            >
              Mark as Complete
            </Button>
          )}
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
  jobCard: {
    margin: 15,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  jobTitle: {
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
  payText: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  providerCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    backgroundColor: '#4caf50',
    marginRight: 15,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    color: '#333',
    fontWeight: 'bold',
  },
  providerVillage: {
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
  applyButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 5,
  },
  appliedCard: {
    backgroundColor: '#e8f5e8',
    elevation: 1,
  },
  appliedText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  appliedSubtext: {
    color: '#666',
    marginTop: 4,
  },
  actionButton: {
    marginBottom: 10,
  },
  completeButton: {
    backgroundColor: '#4caf50',
  },
});