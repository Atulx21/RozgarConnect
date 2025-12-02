import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

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

  // small helpers for counts & colors to match other pages style
  const total = applications.length;
  const counts = applications.reduce(
    (acc, a) => {
      const s = a.status ?? 'pending';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusBadge = (text: string, bg?: string, color?: string) => (
    <View style={[styles.smallBadge, { backgroundColor: bg ?? 'rgba(59,130,246,0.08)', borderColor: color ?? 'rgba(59,130,246,0.12)' }]}>
      <Text style={[styles.smallBadgeText, { color: color ?? '#3B82F6' }]}>{text}</Text>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#F7FAFC', '#F0F9FF']} style={StyleSheet.absoluteFillObject} />
        <View style={[styles.blurCircle, styles.blurCircle1]} />
        <View style={[styles.blurCircle, styles.blurCircle2]} />
        <View style={styles.center}>
          <MaterialIcons name="inbox" size={64} color="#A3AED0" />
          <Text variant="titleLarge" style={styles.unauthTitle}>Sign in to view applications</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.primaryBtn}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.primaryGradient}>
              <Text style={styles.primaryText}>Sign in</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F7FAFC', '#F0F9FF']} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.blurCircle, styles.blurCircle1]} />
      <View style={[styles.blurCircle, styles.blurCircle2]} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text variant="titleLarge" style={styles.title}>Applications</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>{total} total • {counts.hired || 0} hired • {counts.rejected || 0} rejected</Text>
          </View>

          {/* removed refresh and search buttons per request */}
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={applications.length === 0 && !loading ? styles.emptyContainer : undefined}
        refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} colors={['#10B981']} />}
        showsVerticalScrollIndicator={false}
      >
        {applications.length === 0 && !loading ? (
          <View style={styles.emptyCard}>
            <LinearGradient colors={['#FFFFFF', '#F7FAFF']} style={styles.emptyInner}>
              <MaterialIcons name="inbox" size={56} color="#6B7280" />
              <Text variant="titleLarge" style={styles.emptyTitle}>No applications yet</Text>
              <Text variant="bodyMedium" style={styles.emptyText}>Apply to jobs to see them listed here. You'll be able to track application & job status from this tab.</Text>
              <TouchableOpacity onPress={() => router.push('/jobs')} style={styles.secondaryBtn}>
                <Text style={styles.secondaryText}>Browse Jobs</Text>
              </TouchableOpacity>
            </LinearGradient>
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
                    // job removed — show job details unavailable
                  }
                }}
                style={styles.cardTouchable}
              >
                <LinearGradient colors={['#FFFFFF', '#FBFDFF']} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium" style={styles.jobTitle} numberOfLines={2}>{jobTitle}</Text>

                    <View style={styles.badgesRow}>
                      <View style={[styles.badge, { borderColor: jobStatusColor }]}>
                        <Text style={[styles.badgeText, { color: jobStatusColor }]}>{jobStatus.replace('_', ' ').toUpperCase()}</Text>
                      </View>

                      <View style={[styles.appBadge, { backgroundColor: 'rgba(15, 23, 42, 0.04)' }]}>
                        <Text style={[styles.appBadgeText, { color: applicationStatusColor }]}>{applicationStatus.replace('_', ' ').toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.rowLabel}>Applied</Text>
                    <Text style={styles.rowValue}>{app.applied_at ? new Date(app.applied_at).toLocaleString() : '—'}</Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.footerText}>Job status reflects if the job moved forward after your application. Tap to view details.</Text>
                  </View>
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
  blurCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  blurCircle1: {
    width: 260,
    height: 260,
    top: -80,
    right: -50,
  },
  blurCircle2: {
    width: 200,
    height: 200,
    bottom: 120,
    left: -40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  title: { color: '#0F172A', fontWeight: '800' },
  subtitle: { color: '#6B7280', marginTop: 4 },

  list: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 20 },
  emptyCard: {
    marginTop: 24,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.06)',
  },
  emptyInner: { padding: 28, alignItems: 'center' },
  emptyTitle: { marginTop: 12, color: '#1F2937', fontWeight: '700' },
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 8 },
  primaryBtn: { marginTop: 18, width: 160, borderRadius: 12, overflow: 'hidden' },
  primaryGradient: { paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59,130,246,0.12)' },
  secondaryText: { color: '#3B82F6', fontWeight: '700' },

  cardTouchable: { marginBottom: 12 },
  card: {
    padding: 16,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  jobTitle: { color: '#0F172A', fontWeight: '800', flex: 1, marginRight: 12 },
  badgesRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  badge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginLeft: 6 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  appBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginLeft: 6 },
  appBadgeText: { fontSize: 12, fontWeight: '700' },

  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowLabel: { color: '#6B7280' },
  rowValue: { fontWeight: '700', color: '#0F172A' },

  cardFooter: { marginTop: 6 },
  footerText: { color: '#9CA3AF', fontSize: 12 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  unauthTitle: { marginTop: 12, color: '#1F2937', fontWeight: '700' },

  smallBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  smallBadgeText: { fontSize: 12, fontWeight: '700' },
});