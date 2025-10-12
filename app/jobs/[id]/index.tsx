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
  const { user, profile } = useAuth();
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
    if (id && user && profile) {
      if (profile.role === 'worker') {
        checkApplicationStatus();
      } else {
        setIsCheckingStatus(false);
      }
    } else if (!user) {
      setIsCheckingStatus(false);
    }
  }, [id, user, profile]);

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles:provider_id (
            id,
            full_name,
            village,
            rating,
            total_ratings
          )
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
    setIsCheckingStatus(true);
    try {
      const { data } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', id)
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
      console.error('Error applying for job:', error);
      Alert.alert('Error', 'Failed to submit application. You may have already applied.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading Job Details...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="headlineSmall" style={styles.title}>
          Job not found
        </Text>
      </View>
    );
  }

  const isDeadlinePassed = new Date(job.application_deadline) < new Date();

  const renderWorkerActions = () => {
    if (isCheckingStatus) {
      return (
        <View style={styles.actionsContainer}>
          <ActivityIndicator />
        </View>
      );
    }

    if (hasApplied) {
      return (
        <Card style={styles.appliedCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.appliedText}>
              ✓ Application Submitted
            </Text>
            <Text variant="bodyMedium" style={styles.appliedSubtext}>
              The employer will review your application.
            </Text>
          </Card.Content>
        </Card>
      );
    }

    if (isDeadlinePassed) {
      return (
        <Card style={styles.appliedCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.expiredText}>
              Applications Closed
            </Text>
            <Text variant="bodyMedium" style={styles.appliedSubtext}>
              The deadline for this job has passed.
            </Text>
          </Card.Content>
        </Card>
      );
    }

    return (
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
    );
  };

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

      <View style={styles.actionsContainer}>
        {profile?.role === 'provider' && job.profiles.id === user?.id && (
          <>
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
          </>
        )}

        {profile?.role === 'worker' && job.status === 'open' && renderWorkerActions()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 10, 
    color: '#666' 
  },
  header: { 
    paddingTop: 60, 
    paddingHorizontal: 10, 
    backgroundColor: 'white' 
  },
  title: { 
    color: '#2e7d32', 
    fontWeight: 'bold' 
  },
  actionsContainer: { 
    padding: 15 
  },
  appliedCard: { 
    backgroundColor: '#e8f5e8', 
    elevation: 1 
  },
  appliedText: { 
    color: '#2e7d32', 
    fontWeight: 'bold' 
  },
  appliedSubtext: { 
    color: '#666', 
    marginTop: 4 
  },
  expiredText: { 
    color: '#f44336' 
  },
  applyButton: { 
    backgroundColor: '#4caf50', 
    paddingVertical: 5 
  },
  actionButton: { 
    marginBottom: 10 
  },
  completeButton: { 
    backgroundColor: '#4caf50' 
  }
});