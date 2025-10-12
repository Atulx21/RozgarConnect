import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Searchbar, Card, Button, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function SearchScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    jobs: [],
    workers: [],
    equipment: [],
  });
  const [searchType, setSearchType] = useState<'all' | 'jobs' | 'workers' | 'equipment'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch();
    } else {
      setSearchResults({ jobs: [], workers: [], equipment: [] });
    }
  }, [searchQuery, searchType]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = { jobs: [], workers: [], equipment: [] };

      if (searchType === 'all' || searchType === 'jobs') {
        const { data: jobsData } = await supabase
          .from('jobs')
          .select(`
            *,
            profiles:provider_id (full_name, village, rating)
          `)
          .eq('status', 'open')
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
          .limit(5);

        results.jobs = jobsData || [];
      }

      if (searchType === 'all' || searchType === 'workers') {
        const { data: workersData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'worker')
          .or(`full_name.ilike.%${searchQuery}%,village.ilike.%${searchQuery}%`)
          .limit(5);

        results.workers = workersData || [];
      }

      if (searchType === 'all' || searchType === 'equipment') {
        const { data: equipmentData } = await supabase
          .from('equipment')
          .select(`
            *,
            profiles:owner_id (full_name, village, rating)
          `)
          .eq('status', 'available')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
          .limit(5);

        results.equipment = equipmentData || [];
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="titleMedium">Please log in to search</Text>
          <Button mode="contained" onPress={() => router.push('/auth/login')}>
            Login
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button 
          mode="text" 
          onPress={() => router.back()}
          icon="arrow-left"
          style={styles.backButton}
        >
          Back
        </Button>
        <Text variant="headlineSmall" style={styles.title}>
          Search
        </Text>
        
        <Searchbar
          placeholder="Search jobs, workers, or equipment..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          loading={loading}
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          {['all', 'jobs', 'workers', 'equipment'].map(type => (
            <Chip
              key={type}
              selected={searchType === type}
              onPress={() => setSearchType(type as any)}
              style={styles.filterChip}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.resultsList}>
        {searchQuery.length < 2 ? (
          <View style={styles.instructionsContainer}>
            <MaterialIcons name="search" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.instructionsTitle}>
              Start Searching
            </Text>
            <Text variant="bodyMedium" style={styles.instructionsText}>
              Type at least 2 characters to search for jobs, workers, or equipment
            </Text>
          </View>
        ) : (
          <>
            {/* Jobs Results */}
            {(searchType === 'all' || searchType === 'jobs') && searchResults.jobs.length > 0 && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Jobs ({searchResults.jobs.length})
                </Text>
                {searchResults.jobs.map((job) => (
                  <Card key={job.id} style={styles.resultCard}>
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.resultTitle}>
                        {job.title}
                      </Text>
                      <Text variant="bodyMedium" style={styles.resultLocation}>
                        📍 {job.location}
                      </Text>
                      <Text variant="bodyMedium" style={styles.resultPay}>
                        💰 ₹{job.pay_amount} {job.pay_type === 'per_day' ? 'per day' : 'total'}
                      </Text>
                    </Card.Content>
                    <Card.Actions>
                      <Button onPress={() => router.push(`/jobs/${job.id}`)}>
                        View Details
                      </Button>
                    </Card.Actions>
                  </Card>
                ))}
              </View>
            )}

            {/* Workers Results */}
            {(searchType === 'all' || searchType === 'workers') && searchResults.workers.length > 0 && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Workers ({searchResults.workers.length})
                </Text>
                {searchResults.workers.map((worker) => (
                  <Card key={worker.id} style={styles.resultCard}>
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.resultTitle}>
                        {worker.full_name}
                      </Text>
                      <Text variant="bodyMedium" style={styles.resultLocation}>
                        📍 {worker.village}
                      </Text>
                      <Text variant="bodyMedium" style={styles.resultRating}>
                        ⭐ {worker.rating.toFixed(1)} ({worker.total_ratings} reviews)
                      </Text>
                    </Card.Content>
                    <Card.Actions>
                      <Button onPress={() => router.push(`/profile/${worker.id}`)}>
                        View Profile
                      </Button>
                    </Card.Actions>
                  </Card>
                ))}
              </View>
            )}

            {/* Equipment Results */}
            {(searchType === 'all' || searchType === 'equipment') && searchResults.equipment.length > 0 && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Equipment ({searchResults.equipment.length})
                </Text>
                {searchResults.equipment.map((item) => (
                  <Card key={item.id} style={styles.resultCard}>
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.resultTitle}>
                        {item.name}
                      </Text>
                      <Text variant="bodyMedium" style={styles.resultLocation}>
                        📍 {item.location}
                      </Text>
                      <Text variant="bodyMedium" style={styles.resultPay}>
                        💰 ₹{item.rental_price} {item.price_type === 'per_hour' ? 'per hour' : 'per day'}
                      </Text>
                    </Card.Content>
                    <Card.Actions>
                      <Button onPress={() => router.push(`/equipment/${item.id}`)}>
                        View Details
                      </Button>
                    </Card.Actions>
                  </Card>
                ))}
              </View>
            )}

            {/* No Results */}
            {searchQuery.length >= 2 && 
             searchResults.jobs.length === 0 && 
             searchResults.workers.length === 0 && 
             searchResults.equipment.length === 0 && 
             !loading && (
              <View style={styles.noResults}>
                <MaterialIcons name="search-off" size={64} color="#ccc" />
                <Text variant="titleMedium" style={styles.noResultsTitle}>
                  No Results Found
                </Text>
                <Text variant="bodyMedium" style={styles.noResultsText}>
                  Try different keywords or check your spelling
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  title: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  searchBar: {
    marginBottom: 15,
    elevation: 2,
  },
  filtersContainer: {
    marginBottom: 10,
  },
  filterChip: {
    marginRight: 10,
  },
  resultsList: {
    flex: 1,
    padding: 15,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginTop: 100,
    padding: 40,
  },
  instructionsTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: '#666',
  },
  instructionsText: {
    textAlign: 'center',
    color: '#999',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultCard: {
    marginBottom: 10,
    elevation: 1,
  },
  resultTitle: {
    color: '#333',
    fontWeight: 'bold',
  },
  resultLocation: {
    color: '#666',
    marginTop: 4,
  },
  resultPay: {
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 4,
  },
  resultRating: {
    color: '#666',
    marginTop: 4,
  },
  noResults: {
    alignItems: 'center',
    marginTop: 50,
    padding: 40,
  },
  noResultsTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: '#666',
  },
  noResultsText: {
    textAlign: 'center',
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
});