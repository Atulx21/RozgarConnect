import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Chip, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function ApplicationsScreen() {
  const { user, profile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchApplications();
    }
  }, [user, profile]);

  const fetchApplications = async () => {
    try {
      if (profile?.role === 'worker') {
        // Fetch applications made by this worker
        const { data, error } = await supabase
          .from('applications')
          .select(`
            *,
            jobs (
              *,
              profiles:provider_id (full_name, village, rating)
            )
          `)
          .eq('worker_id', user.id)
          .order('applied_at', { ascending: false });

        if (error) throw error;
        setApplications(data || []);
      } else {
        // Fetch applications for jobs posted by this provider
        const { data, error } = await supabase
          .from('applications')
          .select(`
            *,
            jobs!inner (
              *,
              profiles:provider_id (full_name, village, rating)
            ),
            profiles:worker_id (full_name, village, rating)
          `)
          .eq('jobs.provider_id', user.id)
          .order('applied_at', { ascending: false });

        if (error) throw error;
        setApplications(data || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;
      
      // Refresh applications
      fetchApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'hired':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'hired':
        return 'Hired';
      case 'rejected':
        return 'Not Selected';
      default:
        return 'Pending';
    }
  };

  const onRefresh = () => {
    fetchApplications();
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="titleMedium">Please log in to view applications</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          {profile?.role === 'worker' ? 'My Applications' : 'Job Applications'}
        </Text>
      </View>

      <ScrollView 
        style={styles.applicationsList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {applications.map((application) => (
          <Card key={application.id} style={styles.applicationCard}>
            <Card.Content>
              <View style={styles.applicationHeader}>
                <Text variant="titleMedium" style={styles.jobTitle}>
                  {application.jobs.title}
                </Text>
                <Chip 
                  mode="outlined" 
                  textStyle={{ color: getStatusColor(application.status) }}
                  style={{ borderColor: getStatusColor(application.status) }}
                >
                  {getStatusText(application.status)}
                </Chip>
              </View>
              
              <Text variant="bodyMedium" style={styles.jobLocation}>
                📍 {application.jobs.location}
              </Text>
              
              <Text variant="bodyMedium" style={styles.jobPay}>
                💰 ₹{application.jobs.pay_amount} {application.jobs.pay_type === 'per_day' ? 'per day' : 'total'}
              </Text>
              
              {profile?.role === 'worker' ? (
                <Text style={styles.providerInfo}>
                  Posted by: {application.jobs.profiles?.full_name} ({application.jobs.profiles?.village})
                </Text>
              ) : (
                <Text style={styles.workerInfo}>
                  Applied by: {application.profiles?.full_name} ({application.profiles?.village})
                  {application.profiles?.rating > 0 && ` ⭐ ${application.profiles.rating.toFixed(1)}`}
                </Text>
              )}
              
              <Text style={styles.appliedDate}>
                Applied: {new Date(application.applied_at).toLocaleDateString()}
              </Text>
            </Card.Content>
            
            <Card.Actions>
              {profile?.role === 'worker' ? (
                <Button onPress={() => router.push(`/jobs/${application.jobs.id}`)}>
                  View Job
                </Button>
              ) : (
                <View style={styles.providerActions}>
                  <Button onPress={() => router.push(`/profile/${application.worker_id}`)}>
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
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </View>
              )}
            </Card.Actions>
          </Card>
        ))}
        
        {applications.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text variant="titleMedium">No applications found</Text>
            <Text variant="bodyMedium">
              {profile?.role === 'worker' 
                ? 'Start applying to jobs to see them here'
                : 'Applications for your jobs will appear here'
              }
            </Text>
          </View>
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
  title: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  applicationsList: {
    flex: 1,
    padding: 15,
  },
  applicationCard: {
    marginBottom: 15,
    elevation: 2,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    flex: 1,
    color: '#2e7d32',
    fontWeight: 'bold',
    marginRight: 10,
  },
  jobLocation: {
    color: '#666',
    marginBottom: 4,
  },
  jobPay: {
    color: '#4caf50',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  providerInfo: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  workerInfo: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  appliedDate: {
    color: '#888',
    fontSize: 12,
  },
  providerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  hireButton: {
    backgroundColor: '#4caf50',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
  },
});