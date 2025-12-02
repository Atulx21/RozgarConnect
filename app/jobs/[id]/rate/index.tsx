import React, { useEffect, useState, useCallback } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Text, Button, TextInput, ActivityIndicator } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function RateJobScreen() {
  const { id: rawJobId, ratingId } = useLocalSearchParams() as { id?: string; ratingId?: string };
  const jobId = Array.isArray(rawJobId) ? rawJobId[0] : rawJobId;
  const { user, profile } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id,provider_id,status,hired_worker_id')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJob(data);
      // prefer explicit hired_worker_id on job; fallback: ratingId or null
      setWorkerId(data?.hired_worker_id || (ratingId as string) || null);
    } catch (err) {
      console.error('fetchJob error', err);
      Alert.alert('Error', 'Unable to load job details.');
    } finally {
      setLoading(false);
    }
  }, [jobId, ratingId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>You must be signed in to rate.</Text>
        <Button onPress={() => router.push('/auth/login')}>Sign in</Button>
      </View>
    );
  }

  // Guards
  const isProvider = !!(job && user.id === job.provider_id);
  const jobFinished = !!(job && (job.status === 'finished' || job.status === 'completed' || job.status === 'done'));

  const validate = () => {
    if (!workerId) {
      Alert.alert('Error', 'No worker selected to rate.');
      return false;
    }
    if (!isProvider) {
      Alert.alert('Unauthorized', 'Only the job provider can rate the worker.');
      return false;
    }
    if (!jobFinished) {
      Alert.alert('Not allowed', 'You can rate only after the job is finished.');
      return false;
    }
    if (rating < 1 || rating > 5) {
      Alert.alert('Validation', 'Rating must be between 1 and 5.');
      return false;
    }
    return true;
  };

  const submitRating = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      // Insert rating. Prefer DB trigger/RPC for aggregate update. Client does single insert and relies on trigger.
      const payload = {
        job_id: jobId,
        rater_id: user.id,
        worker_id: workerId,
        rating,
        comment: comment.trim() || null,
      };

      const { error: insertError } = await supabase
        .from('ratings')
        .insert(payload, { returning: 'minimal' }); // minimal reduces payload

      if (insertError) {
        // unique violation
        if ((insertError as any)?.code === '23505') {
          Alert.alert('Already rated', 'You have already rated this job/worker.');
          return;
        }
        throw insertError;
      }

      // Optionally: call RPC to recalc profile rating if you don't have DB trigger
      // await supabase.rpc('recalculate_profile_rating', { worker_id: workerId });

      Alert.alert('Thanks', 'Rating submitted successfully.');
      // refresh profile/job lists, then navigate back
      // e.g., router.replace or router.push back to job detail
      router.push(`/jobs/${jobId}`);
    } catch (err) {
      console.error('submitRating error', err);
      Alert.alert('Error', 'Failed to submit rating. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>Rate Worker</Text>

      <Text style={styles.label}>Worker ID</Text>
      <Text>{workerId ?? '—'}</Text>

      <Text style={styles.label}>Rating (1–5)</Text>
      <TextInput
        mode="outlined"
        keyboardType="number-pad"
        value={String(rating)}
        onChangeText={(t) => {
          const n = Number(t.replace(/[^0-9]/g, '')) || 0;
          setRating(Math.max(1, Math.min(5, n)));
        }}
      />

      <Text style={styles.label}>Comment (optional)</Text>
      <TextInput
        mode="outlined"
        multiline
        numberOfLines={4}
        value={comment}
        onChangeText={setComment}
        maxLength={800}
      />

      <Button
        mode="contained"
        onPress={submitRating}
        loading={submitting}
        disabled={submitting}
        style={{ marginTop: 16 }}
      >
        Submit Rating
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: 12 },
  label: { marginTop: 12, marginBottom: 6, fontWeight: '600' },
});