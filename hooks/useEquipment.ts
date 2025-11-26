import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  description: string;
  rental_price: number;
  price_type: 'per_hour' | 'per_day';
  location: string;
  status: string;
  availability_start: string;
  availability_end: string;
  owner_id: string;
  created_at: string;
  photos?: string[]; // added to allow image display
  profiles?: {
    id: string;
    full_name: string;
    village: string;
    rating: number;
    total_ratings: number;
  };
}

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('equipment')
        .select(`
          *,
          profiles:owner_id (*)
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (fetchError) {
        if (fetchError.code === 'PGRST116' || fetchError.message.includes('does not exist')) {
          setError('Database not set up yet. Please connect to Supabase first.');
        } else {
          throw fetchError;
        }
        return;
      }

      setEquipment(data || []);
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError('Failed to load equipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshEquipment = () => {
    fetchEquipment();
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  return {
    equipment,
    loading,
    error,
    refreshEquipment,
  };
}