import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Avatar } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function RateJobScreen() {
  const { id } = useLocalSearchParams(); // job id
  const { user, profile } = useAuth();
  const [job, setJob] = useState(null);
  const [ratedUser, setRatedUser] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

      // Determine who to rate based on current user's role
      if (profile?.role === 'worker') {
        // Worker rates the provider
        setRatedUser(jobData.profiles);
      } else {
        // Provider rates the worker - need to get the hired worker
        const { data: applicationData, error: appError } = await supabase
          .from('applications')
          .select(`
            profiles:worker_id (*)
          `)
          .eq('job_id', id)
          .eq('status', 'hired')
          .single();

        if (appError) throw appError;
        setRatedUser(applicationData.profiles);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('ratings').insert({
        job_id: id,
        rater_id: user.id,
        rated_id: ratedUser.id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      // Update the rated user's average rating
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('rating')
        .eq('rated_id', ratedUser.id);

      if (ratingsError) throw ratingsError;

      const totalRatings = ratingsData.length;
      const averageRating = ratingsData.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

      await supabase
        .from('profiles')
        .update({
          rating: averageRating,
          total_ratings: totalRatings,
        })
        .eq('id', ratedUser.id);

      Alert.alert('Success', 'Rating submitted successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialIcons
          key={i}
          name={i <= rating ? 'star' : 'star-border'}
          size={40}
          color="#ffc107"
          onPress={() => setRating(i)}
          style={styles.star}
        />
      );
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

  if (!job || !ratedUser) {
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
        <Text variant="headlineSmall" style={styles.title}>
          Rate Your Experience
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
        </Card.Content>
      </Card>

      <Card style={styles.ratingCard}>
        <Card.Content>
          <View style={styles.userInfo}>
            <Avatar.Text 
              size={60} 
              label={ratedUser.full_name.charAt(0).toUpperCase()}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text variant="titleMedium" style={styles.userName}>
                Rate {ratedUser.full_name}
              </Text>
              <Text variant="bodyMedium" style={styles.userVillage}>
                📍 {ratedUser.village}
              </Text>
            </View>
          </View>

          <Text variant="titleMedium" style={styles.ratingLabel}>
            How was your experience?
          </Text>

          <View style={styles.starContainer}>
            {renderStarRating()}
          </View>

          <TextInput
            mode="outlined"
            label="Comment (Optional)"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            style={styles.commentInput}
            placeholder="Share your experience..."
          />

          <Button 
            mode="contained" 
            onPress={submitRating}
            loading={submitting}
            disabled={submitting || rating === 0}
            style={styles.submitButton}
            icon="send"
          >
            Submit Rating
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
  },
  ratingCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    backgroundColor: '#4caf50',
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#333',
    fontWeight: 'bold',
  },
  userVillage: {
    color: '#666',
    marginTop: 4,
  },
  ratingLabel: {
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  star: {
    marginHorizontal: 5,
  },
  commentInput: {
    marginBottom: 30,
  },
  submitButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 5,
  },
});