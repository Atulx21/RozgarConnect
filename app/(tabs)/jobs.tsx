import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, Searchbar, FAB } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useJobs } from '@/hooks/useJobs';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

const JOB_CATEGORIES = ['Farming', 'Construction', 'Cleaning', 'Delivery', 'Cooking', 'Other'];

export default function JobsScreen() {
  const { profile } = useAuth();
  const { jobs, loading, error, refreshJobs } = useJobs();
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery, selectedCategory]);

  const filterJobs = () => {
    let filtered = jobs;

    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(job => job.category === selectedCategory);
    }

    setFilteredJobs(filtered);
  };

  const onRefresh = () => {
    refreshJobs();
  };

  if (loading && jobs.length === 0) {
    return <LoadingSpinner message="Loading available jobs..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Unable to Load Jobs"
        message={error}
        onRetry={refreshJobs}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Find Work
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Browse available job opportunities
        </Text>

        <Searchbar
          placeholder="Search jobs, location..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#6DD5A5"
          inputStyle={styles.searchInput}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          <Chip
            selected={selectedCategory === ''}
            onPress={() => setSelectedCategory('')}
            style={[
              styles.categoryChip,
              selectedCategory === '' && styles.categoryChipSelected,
            ]}
            textStyle={selectedCategory === '' && styles.categoryChipTextSelected}
            icon={selectedCategory === '' ? 'check' : undefined}
          >
            All
          </Chip>
          {JOB_CATEGORIES.map(category => (
            <Chip
              key={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipSelected,
              ]}
              textStyle={selectedCategory === category && styles.categoryChipTextSelected}
              icon={selectedCategory === category ? 'check' : undefined}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.jobsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#6DD5A5']} />
        }
      >
        {filteredJobs.map((job) => (
          <Card key={job.id} style={styles.jobCard} mode="elevated">
            <Card.Content>
              <View style={styles.jobHeader}>
                <View style={styles.jobTitleContainer}>
                  <Text variant="titleMedium" style={styles.jobTitle}>
                    {job.title}
                  </Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{job.category}</Text>
                  </View>
                </View>
              </View>

              <Text variant="bodyMedium" style={styles.jobDescription} numberOfLines={2}>
                {job.description}
              </Text>

              <View style={styles.jobDetails}>
                <View style={styles.jobDetailRow}>
                  <MaterialIcons name="location-on" size={18} color="#718096" />
                  <Text style={styles.jobDetailText}>{job.location}</Text>
                </View>

                <View style={styles.jobDetailRow}>
                  <MaterialIcons name="payments" size={18} color="#6DD5A5" />
                  <Text style={styles.jobPayText}>
                    ₹{job.pay_amount} {job.pay_type === 'per_day' ? '/day' : 'total'}
                  </Text>
                </View>

                <View style={styles.jobDetailRow}>
                  <MaterialIcons name="group" size={18} color="#718096" />
                  <Text style={styles.jobDetailText}>
                    {job.workers_needed} worker{job.workers_needed > 1 ? 's' : ''} needed
                  </Text>
                </View>

                {job.profiles && (
                  <View style={styles.providerInfo}>
                    <View style={styles.providerAvatar}>
                      <MaterialIcons name="person" size={16} color="#6DD5A5" />
                    </View>
                    <Text style={styles.providerName}>{job.profiles.full_name}</Text>
                    {job.profiles.rating > 0 && (
                      <View style={styles.ratingBadge}>
                        <MaterialIcons name="star" size={14} color="#FFA500" />
                        <Text style={styles.ratingText}>{job.profiles.rating.toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </Card.Content>
            <Card.Actions style={styles.cardActions}>
              <Button
                mode="text"
                onPress={() => router.push(`/jobs/${job.id}`)}
                textColor="#6DD5A5"
              >
                View Details
              </Button>
            </Card.Actions>
          </Card>
        ))}

        {filteredJobs.length === 0 && !loading && (
          <Card style={styles.emptyCard} mode="elevated">
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="work-off" size={64} color="#CBD5E0" />
              <Text variant="titleLarge" style={styles.emptyTitle}>
                No jobs found
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                {searchQuery || selectedCategory
                  ? 'Try adjusting your search or filters'
                  : 'No jobs available at the moment'}
              </Text>
              {(searchQuery || selectedCategory) && (
                <Button
                  mode="outlined"
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                  }}
                  style={styles.clearButton}
                >
                  Clear Filters
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB
        icon={({ size, color }) => (
          <MaterialIcons name="add" size={size} color={color} />
        )}
        style={styles.fab}
        onPress={() => router.push('/jobs/post')}
        label="Post Job"
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  title: {
    color: '#2D3748',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#718096',
    marginBottom: 20,
  },
  searchBar: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 0,
    backgroundColor: '#F9F9F9',
  },
  searchInput: {
    color: '#2D3748',
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesContent: {
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
  },
  categoryChipSelected: {
    backgroundColor: '#E8F7EF',
  },
  categoryChipTextSelected: {
    color: '#6DD5A5',
    fontWeight: '600',
  },
  jobsList: {
    flex: 1,
    padding: 24,
  },
  jobCard: {
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  jobHeader: {
    marginBottom: 12,
  },
  jobTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  jobTitle: {
    flex: 1,
    color: '#2D3748',
    fontWeight: 'bold',
  },
  categoryBadge: {
    backgroundColor: '#E8F7EF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#6DD5A5',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  jobDescription: {
    color: '#718096',
    marginBottom: 16,
    lineHeight: 20,
  },
  jobDetails: {
    gap: 10,
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobDetailText: {
    color: '#718096',
    fontSize: 14,
  },
  jobPayText: {
    color: '#6DD5A5',
    fontSize: 14,
    fontWeight: '600',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  providerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerName: {
    color: '#2D3748',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: {
    color: '#FFA500',
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  emptyCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    marginTop: 40,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: '#2D3748',
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#718096',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearButton: {
    borderRadius: 16,
    borderColor: '#6DD5A5',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
    backgroundColor: '#6DD5A5',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#6DD5A5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
});
