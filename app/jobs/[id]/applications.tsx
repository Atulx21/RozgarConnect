import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { height } = Dimensions.get('window');

interface Application {
  id: string;
  status: string;
  applied_at: string;
  profiles: {
    id: string;
    full_name: string;
    village: string;
    phone: string;
    rating: number;
    total_ratings: number;
  };
}

interface Job {
  id: string;
  title: string;
  status: string;
}

export default function JobApplicationsScreen() {
  const { id } = useLocalSearchParams();
  const jobId = Array.isArray(id) ? id[0] : (id as string | undefined);
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    fetchApplications();
  }, [jobId]);

  const fetchJobAndApplications = async () => {
    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
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
        // Use jobId in Supabase queries:
        // .eq('job_id', jobId)
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
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <MaterialIcons key={`full-${i}`} name="star" size={14} color="#FFA500" />
      );
    }
    
    if (hasHalfStar && fullStars < 5) {
      stars.push(
        <MaterialIcons key="half" name="star-half" size={14} color="#FFA500" />
      );
    }
    
    const remaining = 5 - stars.length;
    for (let i = 0; i < remaining; i++) {
      stars.push(
        <MaterialIcons key={`empty-${i}`} name="star-border" size={14} color="#FFA500" />
      );
    }
    
    return <View style={styles.starsRow}>{stars}</View>;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      default:
        return '#F59E0B';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'hired':
        return 'rgba(16, 185, 129, 0.15)';
      case 'rejected':
        return 'rgba(239, 68, 68, 0.15)';
      default:
        return 'rgba(245, 158, 11, 0.15)';
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
        <Text style={styles.loadingText}>Loading applications...</Text>
      </View>
    );
  }

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
        <View style={styles.headerTitleContainer}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Applications
          </Text>
          {job && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {job.title}
            </Text>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {applications.length === 0 ? (
          <BlurView intensity={20} tint="light" style={styles.emptyCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.emptyCardGradient}
            >
              <View style={styles.emptyIconContainer}>
                <MaterialIcons name="inbox" size={64} color="#10B981" />
              </View>
              <Text style={styles.emptyTitle}>No Applications Yet</Text>
              <Text style={styles.emptySubtitle}>
                Workers will see your job and apply soon
              </Text>
            </LinearGradient>
          </BlurView>
        ) : (
          <>
            {applications.map((application) => (
              <BlurView 
                key={application.id} 
                intensity={20} 
                tint="light" 
                style={styles.applicationCard}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
                  style={styles.applicationCardGradient}
                >
                  {/* Worker Info */}
                  <View style={styles.applicationHeader}>
                    <View style={styles.workerInfo}>
                      <View style={styles.workerAvatar}>
                        <Text style={styles.workerAvatarText}>
                          {application.profiles.full_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.workerDetails}>
                        <Text style={styles.workerName}>
                          {application.profiles.full_name}
                        </Text>
                        
                        <View style={styles.workerMetaRow}>
                          <MaterialIcons name="location-on" size={14} color="#6B7280" />
                          <Text style={styles.workerVillage}>
                            {application.profiles.village}
                          </Text>
                        </View>

                        <View style={styles.ratingContainer}>
                          {renderStars(application.profiles.rating)}
                          <Text style={styles.ratingText}>
                            {application.profiles.rating.toFixed(1)} ({application.profiles.total_ratings})
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View 
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusBgColor(application.status) }
                      ]}
                    >
                      <Text style={[
                        styles.statusBadgeText,
                        { color: getStatusColor(application.status) }
                      ]}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  {/* Applied Date */}
                  <Text style={styles.appliedDate}>
                    Applied: {new Date(application.applied_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      onPress={() => router.push(`/profile/${application.profiles.id}`)}
                      activeOpacity={0.8}
                      style={styles.viewProfileButton}
                    >
                      <BlurView intensity={15} tint="light" style={styles.viewProfileBlur}>
                        <MaterialIcons name="person" size={18} color="#10B981" />
                        <Text style={styles.viewProfileText}>View Profile</Text>
                      </BlurView>
                    </TouchableOpacity>

                    {application.status === 'pending' && (
                      <View style={styles.pendingActions}>
                        <TouchableOpacity 
                          onPress={() => updateApplicationStatus(application.id, 'hired')}
                          activeOpacity={0.85}
                          style={styles.actionButtonWrapper}
                        >
                          <LinearGradient
                            colors={['#10B981', '#059669']}
                            style={styles.hireButton}
                          >
                            <MaterialIcons name="check" size={18} color="#FFFFFF" />
                            <Text style={styles.hireButtonText}>Hire</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          onPress={() => updateApplicationStatus(application.id, 'rejected')}
                          activeOpacity={0.8}
                          style={styles.rejectButtonWrapper}
                        >
                          <BlurView intensity={15} tint="light" style={styles.rejectButton}>
                            <MaterialIcons name="close" size={18} color="#EF4444" />
                            <Text style={styles.rejectButtonText}>Reject</Text>
                          </BlurView>
                        </TouchableOpacity>
                      </View>
                    )}

                    {application.status === 'hired' && job?.status === 'open' && (
                      <TouchableOpacity 
                        onPress={markJobInProgress}
                        activeOpacity={0.85}
                        style={styles.startJobButtonWrapper}
                      >
                        <LinearGradient
                          colors={['#F59E0B', '#D97706']}
                          style={styles.startJobButton}
                        >
                          <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
                          <Text style={styles.startJobButtonText}>Start Job</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                </LinearGradient>
              </BlurView>
            ))}
          </>
        )}

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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    color: '#1F2937',
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
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
  emptyCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    marginTop: 60,
  },
  emptyCardGradient: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  emptyTitle: {
    color: '#1F2937',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#6B7280',
    fontSize: 15,
    textAlign: 'center',
  },
  applicationCard: {
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
  applicationCardGradient: {
    padding: 20,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workerInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  workerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  workerAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  workerDetails: {
    flex: 1,
    gap: 4,
  },
  workerName: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '700',
  },
  workerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workerVillage: {
    color: '#6B7280',
    fontSize: 13,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    color: '#6B7280',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  appliedDate: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 16,
  },
  actionButtons: {
    gap: 10,
  },
  viewProfileButton: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  viewProfileBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  viewProfileText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  hireButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  hireButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rejectButtonWrapper: {
    flex: 1,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  rejectButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  startJobButtonWrapper: {
    width: '100%',
  },
  startJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    elevation: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  startJobButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});