import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Dimensions, Linking } from 'react-native';
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
  pay_amount: number;
  pay_type: 'per_day' | 'total';
}

interface Worker {
  id: string;
  full_name: string;
  village: string;
  phone: string;
  rating: number;
  total_ratings: number;
  skills?: string[];
}

export default function CompleteJobScreen() {
  const { id } = useLocalSearchParams();
  const jobId = Array.isArray(id) ? id[0] : (id as string | undefined);
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

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

      // Get the hired worker with full details including phone
      const { data: applicationData, error: appError } = await supabase
        .from('applications')
        .select(`
          profiles:worker_id (*)
        `)
        .eq('job_id', jobId)
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

  const handleCallWorker = () => {
    if (!worker?.phone) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }
    
    const phoneUrl = `tel:${worker.phone}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Unable to make phone calls on this device');
        }
      })
      .catch((err) => {
        console.error('Error making call:', err);
        Alert.alert('Error', 'Failed to initiate call');
      });
  };

  const handleMessageWorker = () => {
    if (!worker?.phone) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }
    
    const smsUrl = `sms:${worker.phone}`;
    Linking.canOpenURL(smsUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(smsUrl);
        } else {
          Alert.alert('Error', 'Unable to send messages on this device');
        }
      })
      .catch((err) => {
        console.error('Error sending message:', err);
        Alert.alert('Error', 'Failed to open messaging app');
      });
  };

  const markComplete = async () => {
    try {
      setLoading(true);
      // use 'completed' to satisfy jobs_status_check constraint (was 'finished' -> violates constraint)
      const { data, error } = await supabase
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', jobId);

      if (error) {
        console.error('markComplete supabase error', error);
        throw error;
      }

      Alert.alert('Success', 'Job marked completed.');
      router.push(`/jobs/${jobId}/rate`);
    } catch (err: any) {
      console.error('markComplete error', err);
      // show database message when available
      const msg = err?.message ?? 'Unable to complete job. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
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

  if (!job || !worker) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#F0FDF4', '#DCFCE7', '#E8F5E9']}
          style={StyleSheet.absoluteFillObject}
        />
        <MaterialIcons name="error-outline" size={64} color="#10B981" />
        <Text style={styles.errorText}>Job or worker not found</Text>
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
          Complete Job
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Job Summary Card */}
        <BlurView intensity={20} tint="light" style={styles.jobCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
            style={styles.jobCardGradient}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="work" size={24} color="#10B981" />
              <Text style={styles.cardHeaderText}>Job Summary</Text>
            </View>

            <Text style={styles.jobTitle}>{job.title}</Text>

            <View style={styles.jobDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <MaterialIcons name="location-on" size={18} color="#10B981" />
                </View>
                <Text style={styles.detailText}>{job.location}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <MaterialIcons name="payments" size={18} color="#10B981" />
                </View>
                <Text style={styles.payText}>
                  ₹{job.pay_amount} {job.pay_type === 'per_day' ? 'per day' : 'total'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>

        {/* Worker Details Card */}
        <BlurView intensity={20} tint="light" style={styles.workerCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
            style={styles.workerCardGradient}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="person" size={24} color="#10B981" />
              <Text style={styles.cardHeaderText}>Hired Worker Details</Text>
            </View>

            {/* Worker Avatar and Name */}
            <View style={styles.workerInfo}>
              <View style={styles.workerAvatar}>
                <Text style={styles.workerAvatarText}>
                  {worker.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.workerDetails}>
                <Text style={styles.workerName}>{worker.full_name}</Text>
                
                <View style={styles.workerMetaRow}>
                  <MaterialIcons name="location-on" size={16} color="#6B7280" />
                  <Text style={styles.workerVillage}>{worker.village}</Text>
                </View>

                {worker.rating > 0 && (
                  <View style={styles.ratingBadge}>
                    <MaterialIcons name="star" size={16} color="#FFA500" />
                    <Text style={styles.ratingText}>
                      {worker.rating.toFixed(1)}
                    </Text>
                    <Text style={styles.ratingCount}>
                      ({worker.total_ratings} reviews)
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Contact Details */}
            <View style={styles.contactSection}>
              <Text style={styles.contactSectionTitle}>Contact Information</Text>
              
              {/* Phone Number */}
              <View style={styles.contactDetail}>
                <View style={styles.contactIconContainer}>
                  <MaterialIcons name="phone" size={20} color="#10B981" />
                </View>
                <View style={styles.contactTextContainer}>
                  <Text style={styles.contactLabel}>Phone Number</Text>
                  <Text style={styles.contactValue}>{worker.phone || 'Not provided'}</Text>
                </View>
              </View>

              {/* Skills (if available) */}
              {worker.skills && worker.skills.length > 0 && (
                <View style={styles.contactDetail}>
                  <View style={styles.contactIconContainer}>
                    <MaterialIcons name="build" size={20} color="#10B981" />
                  </View>
                  <View style={styles.contactTextContainer}>
                    <Text style={styles.contactLabel}>Skills</Text>
                    <View style={styles.skillsContainer}>
                      {worker.skills.map((skill, index) => (
                        <View key={index} style={styles.skillBadge}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Contact Action Buttons */}
            {worker.phone && (
              <View style={styles.contactActions}>
                <TouchableOpacity 
                  onPress={handleCallWorker}
                  activeOpacity={0.85}
                  style={styles.contactActionWrapper}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.callButton}
                  >
                    <MaterialIcons name="phone" size={20} color="#FFFFFF" />
                    <Text style={styles.callButtonText}>Call</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleMessageWorker}
                  activeOpacity={0.85}
                  style={styles.contactActionWrapper}
                >
                  <BlurView intensity={15} tint="light" style={styles.messageButton}>
                    <MaterialIcons name="message" size={20} color="#10B981" />
                    <Text style={styles.messageButtonText}>Message</Text>
                  </BlurView>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </BlurView>

        {/* Complete Job Card */}
        <BlurView intensity={20} tint="light" style={styles.completeCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
            style={styles.completeCardGradient}
          >
            <View style={styles.completeIconContainer}>
              <MaterialIcons name="rate-review" size={48} color="#10B981" />
            </View>

            <Text style={styles.completeTitle}>Complete & Rate Worker</Text>
            <Text style={styles.completeDescription}>
              To complete this job, please rate your experience with {worker.full_name}. The job will be marked as completed after you submit your rating.
            </Text>

            <TouchableOpacity 
              onPress={markComplete}
              activeOpacity={0.85}
              style={styles.completeButtonWrapper}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.completeButton}
              >
                <MaterialIcons name="star" size={20} color="#FFFFFF" />
                <Text style={styles.completeButtonText}>Rate Worker & Complete</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </BlurView>

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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardHeaderText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '700',
  },
  jobTitle: {
    color: '#1F2937',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  jobDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  detailText: {
    color: '#6B7280',
    fontSize: 15,
    flex: 1,
  },
  payText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  workerCard: {
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
  workerCardGradient: {
    padding: 24,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  workerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  workerAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  workerDetails: {
    flex: 1,
    gap: 6,
  },
  workerName: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
  },
  workerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workerVillage: {
    color: '#6B7280',
    fontSize: 14,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
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
    fontSize: 12,
  },
  contactSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.1)',
    marginBottom: 20,
  },
  contactSectionTitle: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  contactDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactValue: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  skillBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  skillText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactActionWrapper: {
    flex: 1,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  messageButtonText: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '700',
  },
  completeCard: {
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
  completeCardGradient: {
    padding: 32,
    alignItems: 'center',
  },
  completeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  completeTitle: {
    color: '#1F2937',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  completeDescription: {
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  completeButtonWrapper: {
    width: '100%',
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