import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
  provider_id: string;
  profiles?: {
    id: string;
    full_name: string;
    village: string;
    rating: number;
    total_ratings: number;
  };
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const nowIso = new Date().toISOString();

      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles:provider_id (*)
        `)
        .eq('status', 'open')
        // Ensure we don't get jobs whose application_deadline has already passed
        .gt('application_deadline', nowIso)
        .order('created_at', { ascending: false });

      if (fetchError) {
        if (fetchError.code === 'PGRST116' || fetchError.message.includes('does not exist')) {
          setError('Database not set up yet. Please connect to Supabase first.');
        } else {
          throw fetchError;
        }
        return;
      }

      setJobs(data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshJobs = () => {
    fetchJobs();
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return {
    jobs,
    loading,
    error,
    refreshJobs,
  };
}