import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

type AppWithJob = {
  id: string;
  job_id: string | null;
  status: string | null; // application status (pending/hired/rejected)
  applied_at?: string | null;
  job?: {
    id: string;
    title?: string | null;
    status?: string | null; // job status (open/in_progress/completed/...)
    provider_id?: string | null;
  } | null;
};

export default function WorkerApplicationsTab() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<AppWithJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchApplications = useCallback(async () => {
    if (!user) {
      setApplications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // fetch worker's applications and join job info
      // select syntax: select applications.*, job:jobs(id,title,status,provider_id)
      const { data, error } = await supabase
        .from('applications')
        .select(
          `
            id,
            job_id,
            status,
            applied_at,
            jobs:job_id (
              id,
              title,
              status,
              provider_id
            )
          `
        )
        .eq('worker_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      // Normalize results: supabase returns jobs under "jobs"
      const normalized: AppWithJob[] = (data || []).map((row: any) => ({
        id: row.id,
        job_id: row.job_id,
        status: row.status,
        applied_at: row.applied_at,
        job: row.jobs ?? null,
      }));

      setApplications(normalized);
    } catch (err) {
      console.error('Error fetching applications for worker:', err);
      setApplications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApplications();
  }, [fetchApplications]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text variant="titleMedium">Sign in to view your applications</Text>
        <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.signInBtn}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.signInGradient}>
            <Text style={styles.signInText}>Sign in</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.list}
        contentContainerStyle={applications.length === 0 ? styles.emptyContainer : undefined}
        refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} colors={['#10B981']} />}
        showsVerticalScrollIndicator={false}
      >
        {applications.length === 0 && !loading ? (
          <View style={styles.empty}>
            <MaterialIcons name="inbox" size={48} color="#6B7280" />
            <Text variant="titleLarge" style={styles.emptyTitle}>No applications yet</Text>
            <Text variant="bodyMedium" style={styles.emptyText}>Apply to jobs and track their status here.</Text>
          </View>
        ) : (
          applications.map((app) => {
            const job = app.job;
            const jobTitle = job?.title ?? 'Job removed';
            const jobStatus = job?.status ?? 'unknown';
            const applicationStatus = app.status ?? 'pending';

            const jobStatusColor =
              jobStatus === 'completed' ? '#10B981' :
              jobStatus === 'in_progress' ? '#F59E0B' :
              jobStatus === 'cancelled' ? '#EF4444' : '#3B82F6';

            const applicationStatusColor =
              applicationStatus === 'hired' ? '#10B981' :
              applicationStatus === 'rejected' ? '#EF4444' :
              '#6B7280';

            return (
              <TouchableOpacity
                key={app.id}
                activeOpacity={0.9}
                onPress={() => {
                  if (app.job_id) {
                    router.push(`/jobs/${app.job_id}`);
                  } else {
                    // job removed — optionally navigate to worker's profile or show alert
                  }
                }}
                style={styles.cardTouchable}
              >
                <LinearGradient colors={['#FFFFFF', '#F7FAFF']} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium" style={styles.jobTitle}>{jobTitle}</Text>
                    <View style={[styles.badge, { borderColor: jobStatusColor }]}>
                      <Text style={[styles.badgeText, { color: jobStatusColor }]}>{jobStatus.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.rowLabel}>Application status</Text>
                    <Text style={[styles.rowValue, { color: applicationStatusColor }]}>{applicationStatus.replace('_', ' ').toUpperCase()}</Text>
                  </View>

                  {app.applied_at ? (
                    <View style={styles.cardFooter}>
                      <Text style={styles.appliedAt}>Applied: {new Date(app.applied_at).toLocaleString()}</Text>
                    </View>
                  ) : null}
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  signInBtn: { marginTop: 16 },
  signInGradient: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  signInText: { color: '#FFFFFF', fontWeight: '700' },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  empty: { alignItems: 'center', gap: 12 },
  emptyTitle: { marginTop: 8, color: '#374151', fontWeight: '700' },
  emptyText: { color: '#6B7280', textAlign: 'center', paddingHorizontal: 24, marginTop: 6 },
  cardTouchable: { marginBottom: 12 },
  card: {
    padding: 16,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  jobTitle: { color: '#1F2937', fontWeight: '700', flex: 1 },
  badge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rowLabel: { color: '#6B7280' },
  rowValue: { fontWeight: '700' },
  cardFooter: { marginTop: 4 },
  appliedAt: { color: '#9CA3AF', fontSize: 12 },
});