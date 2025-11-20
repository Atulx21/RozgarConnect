import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Dimensions, TextInput as RNTextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { height } = Dimensions.get('window');

interface Job {
  id: string;
  title: string;
  location: string;
  provider_id: string;
  pay_amount: number;
  pay_type: 'per_day' | 'total';
  profiles: {
    id: string;
    full_name: string;
    village: string;
  };
}

interface RatedUser {
  id: string;
  full_name: string;
  village: string;
}

export default function RateJobScreen() {
  const { id } = useLocalSearchParams();
  const jobId = Array.isArray(id) ? id[0] : (id as string);
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [ratedUser, setRatedUser] = useState<RatedUser | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles:provider_id (*)
        `)
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Determine who to rate based on current user's role
      if (profile?.role === 'worker') {
        // Worker rates the provider
        setRatedUser(jobData.profiles);
      } else {
        // Provider rates the worker - get the hired worker
        const { data: applicationData, error: appError } = await supabase
          .from('applications')
          .select(`
            profiles:worker_id (*)
          `)
          .eq('job_id', jobId)
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
      Alert.alert('Rating Required', 'Please select a rating before submitting');
      return;
    }

    if (!ratedUser || !user || !job) return;

    setSubmitting(true);
    try {
      // Check if rating already exists
      const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('job_id', jobId)
        .eq('rater_id', user.id)
        .single();

      if (existingRating) {
        Alert.alert('Already Rated', 'You have already rated this job');
        setSubmitting(false);
        return;
      }

      // Insert the rating
      const { error: ratingError } = await supabase.from('ratings').insert({
        job_id: jobId,
        rater_id: user.id,
        rated_id: ratedUser.id,
        rating,
        comment: comment.trim() || null,
      });

      if (ratingError) throw ratingError;

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

      // Mark job as completed if rater is the provider
      if (user.id === job.provider_id) {
        const { error: jobUpdateError } = await supabase
          .from('jobs')
          .update({ status: 'completed' })
          .eq('id', jobId);

        if (jobUpdateError) {
          console.error('Error updating job status:', jobUpdateError);
        }
      }

      Alert.alert(
        '✅ Success', 
        profile?.role === 'provider' 
          ? 'Rating submitted and job completed successfully! Thank you for using our platform.'
          : 'Rating submitted successfully! Thank you for your feedback.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              router.replace('/(tabs)/jobs');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      if (error.code === '23505') {
        Alert.alert('Already Rated', 'You have already submitted a rating for this job');
      } else {
        Alert.alert('Error', 'Failed to submit rating. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingFeedback = (rating: number) => {
    switch (rating) {
      case 1: return { emoji: '😞', text: 'Poor', color: '#EF4444' };
      case 2: return { emoji: '😕', text: 'Fair', color: '#F59E0B' };
      case 3: return { emoji: '😊', text: 'Good', color: '#FCD34D' };
      case 4: return { emoji: '😃', text: 'Very Good', color: '#10B981' };
      case 5: return { emoji: '🌟', text: 'Excellent', color: '#059669' };
      default: return { emoji: '', text: '', color: '#6B7280' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#F0FDF4', '#DCFCE7', '#E8F5E9']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.blurCircle1} />
        <View style={styles.blurCircle2} />
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!job || !ratedUser) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#F0FDF4', '#DCFCE7', '#E8F5E9']}
          style={StyleSheet.absoluteFillObject}
        />
        <MaterialIcons name="error-outline" size={64} color="#10B981" />
        <Text style={styles.errorText}>Job not found</Text>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const isProvider = user?.id === job.provider_id;
  const feedback = getRatingFeedback(rating);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F0FDF4', '#DCFCE7', '#E8F5E9']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.blurCircle1} />
      <View style={styles.blurCircle2} />
      <View style={styles.blurCircle3} />

      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.backButtonHeader}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Rate Experience
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Job Summary */}
        <BlurView intensity={20} tint="light" style={styles.jobCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
            style={styles.jobCardGradient}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="work" size={20} color="#10B981" />
              <Text style={styles.cardHeaderText}>Job Summary</Text>
            </View>

            <Text style={styles.jobTitle}>{job.title}</Text>

            <View style={styles.jobMetaRow}>
              <View style={styles.jobMetaItem}>
                <MaterialIcons name="location-on" size={16} color="#6B7280" />
                <Text style={styles.jobMetaText}>{job.location}</Text>
              </View>
              <View style={styles.jobMetaItem}>
                <MaterialIcons name="payments" size={16} color="#10B981" />
                <Text style={styles.payMetaText}>
                  ₹{job.pay_amount} {job.pay_type === 'per_day' ? 'per day' : 'total'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>

        {/* User to Rate */}
        <BlurView intensity={20} tint="light" style={styles.ratingCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
            style={styles.ratingCardGradient}
          >
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {ratedUser.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.userDetails}>
                <Text style={styles.userName}>{ratedUser.full_name}</Text>
                <View style={styles.userMetaRow}>
                  <MaterialIcons name="location-on" size={16} color="#6B7280" />
                  <Text style={styles.userVillage}>{ratedUser.village}</Text>
                </View>

                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {profile?.role === 'worker' ? 'Job Provider' : 'Hired Worker'}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.ratingLabel}>
              How was your experience {profile?.role === 'worker' ? 'with the provider' : 'with the worker'}?
            </Text>

            {/* Stars */}
            <View style={styles.starContainer}>
              {[1,2,3,4,5].map((value) => (
                <TouchableOpacity 
                  key={value} 
                  onPress={() => setRating(value)} 
                  activeOpacity={0.8}
                  style={styles.starButton}
                >
                  <View style={[
                    styles.starWrapper,
                    rating >= value && styles.starWrapperActive
                  ]}>
                    <MaterialIcons 
                      name={rating >= value ? 'star' : 'star-border'} 
                      size={24} 
                      color={rating >= value ? '#FFA500' : '#6B7280'} 
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Feedback */}
            <View style={styles.feedbackContainer}>
              <Text style={[styles.feedbackText, { color: feedback.color }]}>
                {feedback.emoji} {feedback.text}
              </Text>
            </View>

            {/* Comment */}
            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>Write a comment <Text style={styles.optionalText}>(optional)</Text></Text>
              <Text style={styles.commentHint}>Share more details about your experience to help others</Text>
              <View style={styles.commentInputContainer}>
                <RNTextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Type your feedback here..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  style={styles.commentInput}
                  maxLength={500}
                />
              </View>
              <Text style={styles.charCount}>{comment.length}/500</Text>
            </View>

            {/* Info badge */}
            {profile?.role === 'provider' && (
              <View style={styles.infoBadge}>
                <MaterialIcons name="info" size={20} color="#059669" />
                <Text style={styles.infoBadgeText}>
                  After submitting your rating, the job will be marked as completed automatically.
                </Text>
              </View>
            )}

            {/* Submit */}
            <View style={styles.submitButtonWrapper}>
              <TouchableOpacity 
                onPress={submitRating}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.submitButton}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="send" size={20} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Submit Rating</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {rating === 0 && (
                <Text style={styles.warningText}>
                  Please select a rating before submitting.
                </Text>
              )}
            </View>
          </LinearGradient>
        </BlurView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blurCircle1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 1000,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    top: -80,
    right: -60,
  },
  blurCircle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 1000,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    bottom: 100,
    left: -50,
  },
  blurCircle3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 1000,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    top: height * 0.5,
    right: -30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 8,
  },
  errorText: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  headerTitle: {
    color: '#1F2937',
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },
  jobCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  jobCardGradient: { padding: 20 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardHeaderText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  jobTitle: {
    color: '#1F2937',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  jobMetaRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobMetaText: {
    color: '#6B7280',
    fontSize: 14,
  },
  payMetaText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  ratingCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  ratingCardGradient: {
    padding: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.1)',
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
    gap: 4,
  },
  userName: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userVillage: {
    color: '#6B7280',
    fontSize: 14,
  },
  roleBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleBadgeText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '700',
  },
  ratingLabel: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starButton: { padding: 4 },
  starWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  starWrapperActive: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  feedbackContainer: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  feedbackEmoji: { fontSize: 40 },
  feedbackText: { fontSize: 18, fontWeight: '700' },
  commentSection: { marginBottom: 20 },
  commentLabel: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  commentHint: { color: '#9CA3AF', fontSize: 13, marginBottom: 12 },
  optionalText: { color: '#9CA3AF', fontWeight: '400' },
  commentInputContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    minHeight: 120,
  },
  commentInput: {
    padding: 16,
    color: '#1F2937',
    fontSize: 15,
    minHeight: 120,
    fontFamily: 'System',
  },
  charCount: {
    textAlign: 'right',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 6,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 20,
  },
  infoBadgeText: {
    flex: 1,
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  submitButtonWrapper: { width: '100%' },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  warningText: {
    textAlign: 'center',
    color: '#EF4444',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '500',
  },
});