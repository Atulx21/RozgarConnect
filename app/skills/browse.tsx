import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Searchbar, Chip, Avatar } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface SkilledWorker {
  id: string;
  full_name: string;
  village: string;
  rating: number;
  total_ratings: number;
  user_skills: {
    skill_name: string;
    is_verified: boolean;
    jobs_completed: number;
    average_rating: number;
  }[];
}

export default function BrowseSkillsScreen() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<SkilledWorker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<SkilledWorker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [loading, setLoading] = useState(true);

  const commonSkills = [
    'Tractor Driving', 'Paddy Weeding', 'Bricklaying', 'Plumbing', 
    'Electrical Work', 'Carpentry', 'Painting', 'Harvesting',
    'Irrigation', 'Pest Control', 'Cooking', 'Cleaning'
  ];

  useEffect(() => {
    fetchSkilledWorkers();
  }, []);

  useEffect(() => {
    filterWorkers();
  }, [workers, searchQuery, selectedSkill]);

  const fetchSkilledWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_skills (*)
        `)
        .eq('role', 'worker')
        .not('user_skills', 'is', null)
        .order('rating', { ascending: false });

      if (error) {
        console.log('Error fetching skilled workers:', error.message);
        setWorkers([]);
        setLoading(false);
        return;
      }
      
      // Filter out workers with no skills
      const workersWithSkills = (data || []).filter(worker => 
        worker.user_skills && worker.user_skills.length > 0
      );
      
      setWorkers(workersWithSkills);
    } catch (error) {
      console.error('Error fetching skilled workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterWorkers = () => {
    let filtered = workers;

    if (searchQuery) {
      filtered = filtered.filter(worker => 
        worker.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.user_skills.some(skill => 
          skill.skill_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    if (selectedSkill) {
      filtered = filtered.filter(worker => 
        worker.user_skills.some(skill => skill.skill_name === selectedSkill)
      );
    }

    setFilteredWorkers(filtered);
  };

  const onRefresh = () => {
    fetchSkilledWorkers();
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="titleMedium">Please log in to browse skilled workers</Text>
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
          Browse Skilled Workers
        </Text>
        
        <Searchbar
          placeholder="Search workers or skills..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.skillsContainer}
        >
          <Chip
            selected={selectedSkill === ''}
            onPress={() => setSelectedSkill('')}
            style={styles.skillChip}
          >
            All Skills
          </Chip>
          {commonSkills.map(skill => (
            <Chip
              key={skill}
              selected={selectedSkill === skill}
              onPress={() => setSelectedSkill(skill)}
              style={styles.skillChip}
            >
              {skill}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.workersList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {filteredWorkers.map((worker) => (
          <Card key={worker.id} style={styles.workerCard}>
            <Card.Content>
              <View style={styles.workerHeader}>
                <Avatar.Text 
                  size={50} 
                  label={worker.full_name.charAt(0).toUpperCase()}
                  style={styles.avatar}
                />
                <View style={styles.workerInfo}>
                  <Text variant="titleMedium" style={styles.workerName}>
                    {worker.full_name}
                  </Text>
                  <Text variant="bodyMedium" style={styles.workerVillage}>
                    📍 {worker.village}
                  </Text>
                  <Text variant="bodyMedium" style={styles.workerRating}>
                    ⭐ {worker.rating.toFixed(1)} ({worker.total_ratings} reviews)
                  </Text>
                </View>
              </View>
              
              <View style={styles.skillsSection}>
                <Text variant="titleSmall" style={styles.skillsTitle}>
                  Skills:
                </Text>
                <View style={styles.skillsList}>
                  {worker.user_skills.slice(0, 3).map((skill, index) => (
                    <View key={index} style={styles.skillItem}>
                      <Text style={styles.skillName}>
                        {skill.skill_name}
                        {skill.is_verified && ' ✓'}
                      </Text>
                      <Text style={styles.skillStats}>
                        {skill.jobs_completed} jobs
                        {skill.average_rating > 0 && ` • ${skill.average_rating.toFixed(1)}⭐`}
                      </Text>
                    </View>
                  ))}
                  {worker.user_skills.length > 3 && (
                    <Text style={styles.moreSkills}>
                      +{worker.user_skills.length - 3} more skills
                    </Text>
                  )}
                </View>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => router.push(`/profile/${worker.id}`)}>
                View Profile
              </Button>
              <Button 
                mode="contained" 
                onPress={() => router.push('/jobs/post')}
                style={styles.hireButton}
              >
                Post Job for This Worker
              </Button>
            </Card.Actions>
          </Card>
        ))}
        
        {filteredWorkers.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={64} color="#ccc" />
            <Text variant="titleMedium">No skilled workers found</Text>
            <Text variant="bodyMedium">Try adjusting your search or filters</Text>
          </View>
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
  skillsContainer: {
    marginBottom: 10,
  },
  skillChip: {
    marginRight: 10,
  },
  workersList: {
    flex: 1,
    padding: 15,
  },
  workerCard: {
    marginBottom: 15,
    elevation: 2,
  },
  workerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    backgroundColor: '#4caf50',
    marginRight: 15,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    color: '#333',
    fontWeight: 'bold',
  },
  workerVillage: {
    color: '#666',
    marginVertical: 4,
  },
  workerRating: {
    color: '#666',
  },
  skillsSection: {
    marginTop: 10,
  },
  skillsTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  skillsList: {
    gap: 6,
  },
  skillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  skillName: {
    color: '#333',
    fontWeight: '500',
  },
  skillStats: {
    color: '#666',
    fontSize: 12,
  },
  moreSkills: {
    color: '#4caf50',
    fontSize: 12,
    fontStyle: 'italic',
  },
  hireButton: {
    backgroundColor: '#4caf50',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
  },
});