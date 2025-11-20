import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/dateHelpers';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { height } = Dimensions.get('window');

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
  const jobId = Array.isArray(id) ? id[0] : (id as string | undefined);
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    fetchJobDetails();
  }, [jobId]);

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
        .eq('id', jobId)
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
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
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
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#F0FDF4', '#DCFCE7', '#E8F5E9']}
          style={StyleSheet.absoluteFillObject}
        />
        <MaterialIcons name="work-off" size={64} color="#10B981" />
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

  const isDeadlinePassed = new Date(job.application_deadline) < new Date();
  const isOwner = user?.id === job.provider_id;

  const renderApplicantActions = () => {
    if (isCheckingStatus) {
      return (
        <View style={styles.actionLoadingContainer}>
          <ActivityIndicator size="small" color="#10B981" />
        </View>
      );
    }
    
    if (hasApplied) {
      return (
        <BlurView intensity={20} tint="light" style={styles.statusCard}>
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.1)']}
            style={styles.statusCardGradient}
          >
            <MaterialIcons name="check-circle" size={24} color="#10B981" />
            <Text style={styles.appliedText}>Application Submitted</Text>
          </LinearGradient>
        </BlurView>
      );
    }
    
    if (isDeadlinePassed) {
      return (
        <BlurView intensity={20} tint="light" style={styles.statusCard}>
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.1)']}
            style={styles.statusCardGradient}
          >
            <MaterialIcons name="event-busy" size={24} color="#EF4444" />
            <Text style={styles.expiredText}>Applications Closed</Text>
          </LinearGradient>
        </BlurView>
      );
    }
    
    if (job.status === 'open') {
      return (
        <TouchableOpacity 
          onPress={applyForJob} 
          disabled={applying}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.applyButton}
          >
            {applying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="work" size={20} color="#FFFFFF" />
                <Text style={styles.applyButtonText}>Apply for this Job</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    
    return null;
  };

  const renderOwnerActions = () => (
    <View style={styles.ownerActionsContainer}>
      <TouchableOpacity 
        onPress={() => router.push(`/jobs/${job.id}/applications`)}
        activeOpacity={0.85}
      >
        <BlurView intensity={20} tint="light" style={styles.ownerButton}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
            style={styles.ownerButtonGradient}
          >
            <MaterialIcons name="people" size={20} color="#10B981" />
            <Text style={styles.ownerButtonText}>View Applications</Text>
          </LinearGradient>
        </BlurView>
      </TouchableOpacity>

      {job.status === 'in_progress' && (
        <TouchableOpacity 
          onPress={() => router.push(`/jobs/${job.id}/complete`)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.completeButton}
          >
            <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>Mark as Complete</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#F0FDF4', '#DCFCE7', '#E8F5E9']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Subtle Blurred Accent Circles */}
      <View style={styles.blurCircle1} />
      <View style={styles.blurCircle2} />
      <View style={styles.blurCircle3} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.backButtonHeader}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Job Details
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Job Card */}
        <BlurView intensity={20} tint="light" style={styles.jobCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
            style={styles.jobCardGradient}
          >
            {/* Job Title & Category */}
            <View style={styles.titleSection}>
              <Text variant="headlineSmall" style={styles.jobTitle}>
                {job.title}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{job.category}</Text>
              </View>
            </View>

            {/* Status Badge */}
            <View style={[
              styles.statusBadge,
              job.status === 'open' && styles.statusBadgeOpen,
              job.status === 'in_progress' && styles.statusBadgeInProgress,
              job.status === 'completed' && styles.statusBadgeCompleted,
            ]}>
              <Text style={styles.statusBadgeText}>
                {job.status === 'open' ? '🟢 Open' : 
                 job.status === 'in_progress' ? '🟡 In Progress' : 
                 '✅ Completed'}
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.description}>{job.description}</Text>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              {/* Location */}
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <MaterialIcons name="location-on" size={18} color="#10B981" />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{job.location}</Text>
                </View>
              </View>

              {/* Pay */}
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <MaterialIcons name="payments" size={18} color="#10B981" />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Payment</Text>
                  <Text style={styles.payValue}>
                    ₹{job.pay_amount} {job.pay_type === 'per_day' ? 'per day' : 'total'}
                  </Text>
                </View>
              </View>

              {/* Workers Needed */}
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <MaterialIcons name="group" size={18} color="#10B981" />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Workers Needed</Text>
                  <Text style={styles.detailValue}>
                    {job.workers_needed} worker{job.workers_needed > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Deadline */}
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <MaterialIcons 
                    name="event" 
                    size={18} 
                    color={isDeadlinePassed ? '#EF4444' : '#10B981'} 
                  />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Application Deadline</Text>
                  <Text style={[
                    styles.detailValue,
                    isDeadlinePassed && styles.expiredDeadline
                  ]}>
                    {formatDate(job.application_deadline)}
                    {isDeadlinePassed && ' (Expired)'}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </BlurView>

        {/* Provider Card */}
        {job.profiles && (
          <BlurView intensity={20} tint="light" style={styles.providerCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.providerCardGradient}
            >
              <Text style={styles.sectionTitle}>Job Provider</Text>
              
              <View style={styles.providerInfo}>
                <View style={styles.providerAvatar}>
                  <MaterialIcons name="person" size={24} color="#10B981" />
                </View>
                
                <View style={styles.providerDetails}>
                  <Text style={styles.providerName}>{job.profiles.full_name}</Text>
                  <View style={styles.providerMetaRow}>
                    <MaterialIcons name="location-on" size={14} color="#6B7280" />
                    <Text style={styles.providerVillage}>{job.profiles.village}</Text>
                  </View>
                </View>

                {job.profiles.rating > 0 && (
                  <View style={styles.ratingBadge}>
                    <MaterialIcons name="star" size={16} color="#FFA500" />
                    <Text style={styles.ratingText}>{job.profiles.rating.toFixed(1)}</Text>
                    <Text style={styles.ratingCount}>({job.profiles.total_ratings})</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </BlurView>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {user && (isOwner ? renderOwnerActions() : renderApplicantActions())}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  jobCard: {
    borderRadius: 24,
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
  jobCardGradient: {
    padding: 24,
  },
  titleSection: {
    marginBottom: 12,
  },
  jobTitle: {
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 32,
  },
  categoryBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  categoryBadgeText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusBadgeOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusBadgeInProgress: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  detailsGrid: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '600',
  },
  payValue: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
  },
  expiredDeadline: {
    color: '#EF4444',
  },
  providerCard: {
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
  providerCardGradient: {
    padding: 20,
  },
  sectionTitle: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  providerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  providerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  providerVillage: {
    color: '#6B7280',
    fontSize: 13,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.2)',
  },
  ratingText: {
    color: '#FFA500',
    fontSize: 14,
    fontWeight: '700',
  },
  ratingCount: {
    color: '#FFA500',
    fontSize: 11,
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statusCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  appliedText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
  },
  expiredText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  applyButton: {
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
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  ownerActionsContainer: {
    gap: 12,
  },
  ownerButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  ownerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  ownerButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
  },
  completeButton: {
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
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});