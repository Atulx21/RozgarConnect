import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Avatar } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function CompleteJobScreen() {
  const { id } = useLocalSearchParams();
  const { user, profile } = useAuth();
  const [job, setJob] = useState(null);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles:provider_id (*)
        `)
        .eq('id', id)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Get the hired worker
      const { data: applicationData, error: appError } = await supabase
        .from('applications')
        .select(`
          profiles:worker_id (*)
        `)
        .eq('job_id', id)
        .eq('status', 'hired')
        .single();

      if (appError) throw appError;
      setWorker(applicationData.profiles);
    } catch (error) {
      console.error('Error fetching job details:', error);
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const completeJob = async () => {
    setCompleting(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;

      Alert.alert(
        'Job Completed!', 
        'The job has been marked as completed. Please rate your experience.',
        [
          { 
            text: 'Rate Now', 
            onPress: () => router.replace(`/jobs/rate/${id}`)
          }
        ]
      );
    } catch (error) {
      console.error('Error completing job:', error);
      Alert.alert('Error', 'Failed to complete job');
    } finally {
      setCompleting(false);
    }
  };

  if (loading || !job || !worker) {
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
          Complete Job
        </Text>
      </View>

      <Card style={styles.jobCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.jobTitle}>
            {job.title}
          </Text>
          <Text variant="bodyMedium" style={styles.jobLocation}>
            📍 {job.location}
          </Text>
          <Text variant="bodyMedium" style={styles.jobPay}>
            💰 ₹{job.pay_amount} {job.pay_type === 'per_day' ? 'per day' : 'total'}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.workerCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Hired Worker
          </Text>
          
          <View style={styles.workerInfo}>
            <Avatar.Text 
              size={60} 
              label={worker.full_name.charAt(0).toUpperCase()}
              style={styles.avatar}
            />
            <View style={styles.workerDetails}>
              <Text variant="titleMedium" style={styles.workerName}>
                {worker.full_name}
              </Text>
              <Text variant="bodyMedium" style={styles.workerVillage}>
                📍 {worker.village}
              </Text>
              <Text variant="bodyMedium" style={styles.workerRating}>
                ⭐ {worker.rating.toFixed(1)} ({worker.total_ratings} reviews)
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.completeCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.completeTitle}>
            Mark Job as Complete
          </Text>
          <Text variant="bodyMedium" style={styles.completeDescription}>
            Once you mark this job as complete, you'll be able to rate the worker and they can rate you too.
          </Text>
          
          <Button 
            mode="contained" 
            onPress={completeJob}
            loading={completing}
            disabled={completing}
            style={styles.completeButton}
            icon="check-circle"
          >
            Mark as Complete
          </Button>
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
    marginBottom: 5,
  },
  jobLocation: {
    color: '#666',
    marginBottom: 4,
  },
  jobPay: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  workerCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  workerRating: {
    color: '#666',
  },
  completeCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  completeTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  completeDescription: {
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  completeButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 5,
  },
});