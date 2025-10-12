import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { router } from 'expo-router';

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
  profiles?: {
    full_name: string;
    village: string;
    rating: number;
  };
}

interface JobCardProps {
  job: Job;
  showApplyButton?: boolean;
}

export default function JobCard({ job, showApplyButton = false }: JobCardProps) {
  const handleViewDetails = () => {
    router.push(`/jobs/${job.id}`);
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            {job.title}
          </Text>
          <Chip mode="outlined" compact>
            {job.category}
          </Chip>
        </View>
        
        <Text variant="bodyMedium" style={styles.description}>
          {job.description.length > 100 
            ? `${job.description.substring(0, 100)}...` 
            : job.description}
        </Text>
        
        <View style={styles.details}>
          <Text style={styles.location}>📍 {job.location}</Text>
          <Text style={styles.pay}>
            💰 ₹{job.pay_amount} {job.pay_type === 'per_day' ? 'per day' : 'total'}
          </Text>
          <Text style={styles.workers}>
            👥 {job.workers_needed} worker{job.workers_needed > 1 ? 's' : ''} needed
          </Text>
          {job.profiles && (
            <Text style={styles.provider}>
              Posted by: {job.profiles.full_name} ({job.profiles.village})
              {job.profiles.rating > 0 && ` ⭐ ${job.profiles.rating.toFixed(1)}`}
            </Text>
          )}
        </View>
      </Card.Content>
      <Card.Actions>
        <Button onPress={handleViewDetails}>
          View Details
        </Button>
        {showApplyButton && (
          <Button mode="contained" onPress={handleViewDetails}>
            Apply Now
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    color: '#2e7d32',
    fontWeight: 'bold',
    marginRight: 10,
  },
  description: {
    color: '#666',
    marginBottom: 12,
  },
  details: {
    gap: 4,
  },
  location: {
    color: '#666',
  },
  pay: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  workers: {
    color: '#666',
  },
  provider: {
    color: '#888',
    fontSize: 12,
  },
});