import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { height } = Dimensions.get('window');

export default function MyJobsScreen() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyJobs();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMyJobs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`*, applications (id)`)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching my jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'in_progress':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#3B82F6';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'rgba(16, 185, 129, 0.15)';
      case 'in_progress':
        return 'rgba(245, 158, 11, 0.15)';
      case 'cancelled':
        return 'rgba(239, 68, 68, 0.15)';
      default:
        return 'rgba(59, 130, 246, 0.15)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Open';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'in_progress':
        return 'pending';
      case 'cancelled':
        return 'cancel';
      default:
        return 'schedule';
    }
  };

  const onRefresh = () => {
    fetchMyJobs();
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#F0FDF4', '#DCFCE7', '#E8F5E9']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View style={[styles.blurCircle, styles.blurCircle1]} />
        <View style={[styles.blurCircle, styles.blurCircle2]} />

        <View style={styles.unauthState}>
          <BlurView intensity={20} tint="light" style={styles.unauthCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.unauthCardGradient}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="lock" size={48} color="#10B981" />
              </View>
              <Text variant="titleLarge" style={styles.unauthTitle}>
                Access Denied
              </Text>
              <Text variant="bodyMedium" style={styles.unauthText}>
                You must be logged in to view your jobs
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/auth/login')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.loginButton}
                >
                  <Text style={styles.loginButtonText}>Login</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </BlurView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background with Subtle Blurred Circles */}
      <LinearGradient
        colors={['#F0FDF4', '#DCFCE7', '#E8F5E9']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Subtle Blurred Accent Circles */}
      <View style={[styles.blurCircle, styles.blurCircle1]} />
      <View style={[styles.blurCircle, styles.blurCircle2]} />
      <View style={[styles.blurCircle, styles.blurCircle3]} />

      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <BlurView intensity={20} tint="light" style={styles.backButtonBlur}>
            <MaterialIcons name="arrow-back" size={24} color="#10B981" />
          </BlurView>
        </TouchableOpacity>

        <Text variant="headlineMedium" style={styles.title}>
          My Posted Jobs
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Manage your job listings and applications
        </Text>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <BlurView intensity={20} tint="light" style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconContainer}>
                <MaterialIcons name="work" size={24} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{jobs.length}</Text>
              <Text style={styles.statLabel}>Total Jobs</Text>
            </LinearGradient>
          </BlurView>

          <BlurView intensity={20} tint="light" style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconContainer}>
                <MaterialIcons name="inbox" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>
                {jobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Applications</Text>
            </LinearGradient>
          </BlurView>

          <BlurView intensity={20} tint="light" style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconContainer}>
                <MaterialIcons name="schedule" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>
                {jobs.filter(j => j.status === 'open').length}
              </Text>
              <Text style={styles.statLabel}>Open</Text>
            </LinearGradient>
          </BlurView>
        </View>
      </View>

      <ScrollView 
        style={styles.jobsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#10B981']} />
        }
      >
        {jobs.length === 0 && !loading ? (
          <BlurView intensity={20} tint="light" style={styles.emptyCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.emptyCardGradient}
            >
              <View style={styles.emptyContent}>
                <View style={styles.emptyIconContainer}>
                  <MaterialIcons name="work-outline" size={48} color="#10B981" />
                </View>
                <Text variant="titleLarge" style={styles.emptyTitle}>
                  No Jobs Posted Yet
                </Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  Start by posting your first job and connect with workers
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/jobs/post')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.postFirstJobButton}
                  >
                    <MaterialIcons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.postFirstJobButtonText}>Post Your First Job</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        ) : (
          jobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              activeOpacity={0.9}
              onPress={() => router.push(`/jobs/${job.id}`)}
            >
              <BlurView intensity={20} tint="light" style={styles.jobCard}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
                  style={styles.jobCardGradient}
                >
                  <View style={styles.jobCardContent}>
                    {/* Job Header */}
                    <View style={styles.jobHeader}>
                      <View style={styles.jobTitleContainer}>
                        <Text variant="titleMedium" style={styles.jobTitle}>
                          {job.title}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusBgColor(job.status) }
                        ]}>
                          <MaterialIcons 
                            name={getStatusIcon(job.status)} 
                            size={14} 
                            color={getStatusColor(job.status)} 
                          />
                          <Text style={[
                            styles.statusBadgeText,
                            { color: getStatusColor(job.status) }
                          ]}>
                            {getStatusText(job.status)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Job Description */}
                    <Text variant="bodyMedium" style={styles.jobDescription} numberOfLines={2}>
                      {job.description}
                    </Text>

                    {/* Job Details */}
                    <View style={styles.jobDetails}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <MaterialIcons name="location-on" size={16} color="#10B981" />
                        </View>
                        <Text style={styles.detailText}>{job.location}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <MaterialIcons name="payments" size={16} color="#10B981" />
                        </View>
                        <Text style={styles.payText}>
                          ₹{job.pay_amount} {job.pay_type === 'per_day' ? '/day' : 'total'}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <MaterialIcons name="group" size={16} color="#10B981" />
                        </View>
                        <Text style={styles.detailText}>
                          {job.workers_needed} worker{job.workers_needed > 1 ? 's' : ''} needed
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <MaterialIcons name="inbox" size={16} color="#3B82F6" />
                        </View>
                        <Text style={styles.applicationsText}>
                          {job.applications?.length || 0} application{(job.applications?.length || 0) !== 1 ? 's' : ''} received
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.detailsButton}
                        onPress={() => router.push(`/jobs/${job.id}`)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.detailsButtonText}>View Details</Text>
                        <MaterialIcons name="arrow-forward" size={18} color="#10B981" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => router.push(`/jobs/${job.id}/applications`)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={['#10B981', '#059669']}
                          style={styles.applicationsButton}
                        >
                          <MaterialIcons name="inbox" size={18} color="#FFFFFF" />
                          <Text style={styles.applicationsButtonText}>
                            Applications ({job.applications?.length || 0})
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => router.push('/jobs/post')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.fab}
        >
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.fabText}>Post Job</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  blurCircle1: {
    width: 280,
    height: 280,
    top: -80,
    right: -60,
  },
  blurCircle2: {
    width: 220,
    height: 220,
    bottom: 100,
    left: -50,
  },
  blurCircle3: {
    width: 180,
    height: 180,
    top: height * 0.5,
    right: -30,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  title: {
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6B7280',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  jobsList: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  jobCard: {
    marginBottom: 16,
    borderRadius: 20,
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
  jobCardGradient: {
    padding: 20,
  },
  jobCardContent: {
    gap: 12,
  },
  jobHeader: {
    marginBottom: 4,
  },
  jobTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  jobTitle: {
    flex: 1,
    color: '#1F2937',
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  jobDescription: {
    color: '#6B7280',
    lineHeight: 20,
  },
  jobDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    color: '#6B7280',
    fontSize: 14,
    flex: 1,
  },
  payText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  applicationsText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.1)',
    marginTop: 4,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  detailsButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  applicationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  applicationsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    marginTop: 40,
  },
  emptyCardGradient: {
    padding: 40,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  postFirstJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  postFirstJobButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  unauthState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unauthCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  unauthCardGradient: {
    padding: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  unauthTitle: {
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 8,
  },
  unauthText: {
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});