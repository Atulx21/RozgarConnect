import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Chip, Divider, Avatar } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/dateHelpers';

interface Job {
  id: string;
  provider_id: string;
  title: string;
  category: string;
  description: string;
  workers_needed: number;
  pay_amount: number;
  pay_type: 'per_day' | 'total';
  location: string;
  status: string;
  created_at: string;
  application_deadline: string;
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
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  useEffect(() => {
    if (id && user && job && user.id !== job.provider_id) {
      checkApplicationStatus();
    } else {
      setIsCheckingStatus(false);
    }
  }, [id, user, job]);

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
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!user || !job) return;
    setIsCheckingStatus(true);
    try {
      const { data } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', job.id)
        .eq('worker_id', user.id)
        .single();
      setHasApplied(!!data);
    } catch (error) {
      setHasApplied(false);
    } finally {
      setIsCheckingStatus(false);
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
      Alert.alert('Error', 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Job not found</Text>
      </View>
    );
  }

  const isDeadlinePassed = new Date(job.application_deadline) < new Date();
  const isOwner = user?.id === job.provider_id;

  const renderApplicantActions = () => {
    if (isCheckingStatus) return <ActivityIndicator />;
    if (hasApplied) {
      return (
        <Card style={styles.appliedCard}>
          <Card.Content>
            <Text style={styles.appliedText}>✓ Application Submitted</Text>
          </Card.Content>
        </Card>
      );
    }
    if (isDeadlinePassed) {
      return (
        <Card style={styles.appliedCard}>
          <Card.Content>
            <Text style={styles.expiredText}>Applications Closed</Text>
          </Card.Content>
        </Card>
      );
    }
    if (job.status === 'open') {
      return (
        <Button 
          mode="contained" 
          onPress={applyForJob} 
          loading={applying} 
          disabled={applying} 
          style={styles.applyButton}
        >
          Apply for this Job
        </Button>
      );
    }
    return null;
  };

  const renderOwnerActions = () => (
    <>
      <Button 
        mode="outlined" 
        onPress={() => router.push(`/jobs/${job.id}/applications`)} 
        style={styles.actionButton}
      >
        View Applications
      </Button>
      {job.status === 'in_progress' && (
        <Button 
          mode="contained" 
          onPress={() => router.push(`/jobs/${job.id}/complete`)} 
          style={[styles.actionButton, styles.completeButton]}
        >
          Mark as Complete
        </Button>
      )}
    </>
  );

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
          Job Details
        </Text>
      </View>

      <Card style={styles.jobCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.jobTitle}>
            {job.title}
          </Text>
          <Chip style={styles.categoryChip}>{job.category}</Chip>
          
          <Text style={styles.description}>{job.description}</Text>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <MaterialIcons name="location-on" size={20} color="#666" />
              <Text style={styles.detailText}>{job.location}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialIcons name="attach-money" size={20} color="#4caf50" />
              <Text style={styles.payText}>
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
              <MaterialIcons 
                name="event" 
                size={20} 
                color={isDeadlinePassed ? '#f44336' : '#666'} 
              />
              <Text style={[styles.detailText, isDeadlinePassed && styles.expiredText]}>
                Apply by: {formatDate(job.application_deadline)}
                {isDeadlinePassed && " (Expired)"}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.actionsContainer}>
        {user && (isOwner ? renderOwnerActions() : renderApplicantActions())}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
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
  jobCard: {
    margin: 15,
    elevation: 2,
  },
  jobTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  description: {
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#666',
  },
  payText: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  actionsContainer: {
    padding: 15,
  },
  appliedCard: {
    backgroundColor: '#e8f5e8',
    elevation: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  appliedText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  expiredText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  applyButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 5,
  },
  actionButton: {
    marginBottom: 10,
  },
  completeButton: {
    backgroundColor: '#4caf50',
  },
});