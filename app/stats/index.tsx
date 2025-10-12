import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Stats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalWorkers: number;
  totalProviders: number;
  totalEquipment: number;
  averageRating: number;
}

export default function StatsScreen() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalWorkers: 0,
    totalProviders: 0,
    totalEquipment: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Fetch job statistics
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('status');

      if (!jobsError && jobsData) {
        const totalJobs = jobsData.length;
        const activeJobs = jobsData.filter(job => job.status === 'open' || job.status === 'in_progress').length;
        const completedJobs = jobsData.filter(job => job.status === 'completed').length;
        
        setStats(prev => ({ ...prev, totalJobs, activeJobs, completedJobs }));
      }

      // Fetch user statistics
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('role, rating');

      if (!usersError && usersData) {
        const totalWorkers = usersData.filter(user => user.role === 'worker').length;
        const totalProviders = usersData.filter(user => user.role === 'provider').length;
        const averageRating = usersData.reduce((sum, user) => sum + user.rating, 0) / usersData.length;
        
        setStats(prev => ({ ...prev, totalWorkers, totalProviders, averageRating }));
      }

      // Fetch equipment statistics
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('id');

      if (!equipmentError && equipmentData) {
        setStats(prev => ({ ...prev, totalEquipment: equipmentData.length }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="titleMedium">Please log in to view statistics</Text>
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
          Platform Statistics
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialIcons name="work" size={32} color="#4caf50" />
            <Text variant="headlineMedium" style={styles.statNumber}>
              {stats.totalJobs}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Total Jobs Posted
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialIcons name="trending-up" size={32} color="#ff9800" />
            <Text variant="headlineMedium" style={styles.statNumber}>
              {stats.activeJobs}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Active Jobs
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialIcons name="check-circle" size={32} color="#2196f3" />
            <Text variant="headlineMedium" style={styles.statNumber}>
              {stats.completedJobs}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Completed Jobs
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialIcons name="group" size={32} color="#9c27b0" />
            <Text variant="headlineMedium" style={styles.statNumber}>
              {stats.totalWorkers}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Registered Workers
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialIcons name="business" size={32} color="#607d8b" />
            <Text variant="headlineMedium" style={styles.statNumber}>
              {stats.totalProviders}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Work Providers
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialIcons name="build" size={32} color="#795548" />
            <Text variant="headlineMedium" style={styles.statNumber}>
              {stats.totalEquipment}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Equipment Listed
            </Text>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.averageRatingCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.averageRatingTitle}>
            Platform Average Rating
          </Text>
          <View style={styles.averageRatingContainer}>
            <Text variant="headlineLarge" style={styles.averageRatingNumber}>
              {stats.averageRating.toFixed(1)}
            </Text>
            <MaterialIcons name="star" size={40} color="#ffc107" />
          </View>
          <Text variant="bodyMedium" style={styles.averageRatingSubtext}>
            Based on all user ratings across the platform
          </Text>
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
  statsGrid: {
    padding: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statCard: {
    width: '47%',
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statNumber: {
    color: '#333',
    fontWeight: 'bold',
    marginVertical: 10,
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
  },
  averageRatingCard: {
    margin: 15,
    elevation: 2,
  },
  averageRatingTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  averageRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  averageRatingNumber: {
    color: '#ffc107',
    fontWeight: 'bold',
  },
  averageRatingSubtext: {
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});