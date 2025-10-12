import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Avatar, Chip } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Application {
  id: string;
  status: string;
  applied_at: string;
  profiles: {
    id: string;
    full_name: string;
    village: string;
    rating: number;
    total_ratings: number;
  };
}

export default function JobApplicationsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobAndApplications();
  }, [id]);

  const fetchJobAndApplications = async () => {
    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Fetch applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          *,
          profiles:worker_id (*)
        `)
        .eq('job_id', id)
        .order('applied_at', { ascending: false });

      if (applicationsError) throw applicationsError;
      setApplications(applicationsData || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      Alert.alert('Success', `Application ${status} successfully!`);
      fetchJobAndApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      Alert.alert('Error', 'Failed to update application');
    }
  };

  const markJobInProgress = async () => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'in_progress' })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Success', 'Job marked as in progress!');
      fetchJobAndApplications();
    } catch (error) {
      console.error('Error updating job status:', error);
      Alert.alert('Error', 'Failed to update job status');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      default:
        return '#ff9800';
    }
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
        <Text variant="headlineSmall" style={styles.title}>
          Applications for "{job?.title}"
        </Text>
      </View>

      {applications.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="inbox" size={64} color="#ccc" />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No Applications Yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Workers will see your job and apply soon
          </Text>
        </View>
      ) : (
        <View style={styles.applicationsList}>
          {applications.map((application) => (
            <Card key={application.id} style={styles.applicationCard}>
              <Card.Content>
                <View style={styles.applicationHeader}>
                  <View style={styles.workerInfo}>
                    <Avatar.Text 
                      size={50} 
                      label={application.profiles.full_name.charAt(0).toUpperCase()}
                      style={styles.avatar}
                    />
                    <View style={styles.workerDetails}>
                      <Text variant="titleMedium" style={styles.workerName}>
                        {application.profiles.full_name}
                      </Text>
                      <Text variant="bodyMedium" style={styles.workerVillage}>
                        📍 {application.profiles.village}
                      </Text>
                      <View style={styles.ratingContainer}>
                        <View style={styles.stars}>
                          {renderStars(application.profiles.rating)}
                        </View>
                        <Text style={styles.ratingText}>
                          {application.profiles.rating.toFixed(1)} ({application.profiles.total_ratings} reviews)
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Chip 
                    mode="outlined" 
                    textStyle={{ color: getStatusColor(application.status) }}
                    style={{ borderColor: getStatusColor(application.status) }}
                  >
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Chip>
                  {application.status === 'hired' && job.status === 'open' && (
                    <Button 
                      mode="contained"
                      onPress={() => markJobInProgress()}
                      style={styles.startButton}
                    >
                      Start Job
                    </Button>
                  )}
                </View>

                <Text style={styles.appliedDate}>
                  Applied: {new Date(application.applied_at).toLocaleDateString()}
                </Text>
              </Card.Content>

              <Card.Actions>
                <Button 
                  mode="text"
                  onPress={() => router.push(`/profile/${application.profiles.id}`)}
                >
                  View Profile
                </Button>
                
                {application.status === 'pending' && (
                  <>
                    <Button 
                      mode="contained"
                      onPress={() => updateApplicationStatus(application.id, 'hired')}
                      style={styles.hireButton}
                    >
                      Hire
                    </Button>
                    <Button 
                      mode="outlined"
                      onPress={() => updateApplicationStatus(application.id, 'rejected')}
                      textColor="#f44336"
                    >
                      Reject
                    </Button>
                  </>
                )}
              </Card.Actions>
            </Card>
          ))}
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
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
  applicationsList: {
    padding: 15,
  },
  applicationCard: {
    marginBottom: 15,
    elevation: 2,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  workerInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 15,
  },
  avatar: {
    backgroundColor: '#4caf50',
    marginRight: 15,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    color: '#333',
    fontWeight: 'bold',
  },
  workerVillage: {
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
  appliedDate: {
    color: '#888',
    fontSize: 12,
  },
  hireButton: {
    backgroundColor: '#4caf50',
  },
  startButton: {
    backgroundColor: '#ff9800',
  },
});