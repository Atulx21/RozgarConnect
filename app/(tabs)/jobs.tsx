  import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useJobs } from '@/hooks/useJobs';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { height } = Dimensions.get('window');

const JOB_CATEGORIES = ['Farming', 'Construction', 'Cleaning', 'Delivery', 'Cooking', 'Other'];

export default function JobsScreen() {
  const { profile } = useAuth();
  const { jobs, loading, error, refreshJobs } = useJobs();
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery, selectedCategory]);

  const filterJobs = () => {
    let filtered = [...jobs];

    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(job => job.category === selectedCategory);
    }

    setFilteredJobs(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshJobs();
    } catch (err) {
      console.error('Error refreshing jobs:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
  };

  if (loading && jobs.length === 0) {
    return <LoadingSpinner message="Loading available jobs..." />;
  }

  if (error && jobs.length === 0) {
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
        <Text variant="headlineMedium" style={styles.title}>
          Find Work
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Browse available job opportunities
        </Text>

        {/* Search Bar with Blur */}
        <BlurView intensity={20} tint="light" style={styles.searchBarContainer}>
          <View style={styles.searchBarWrapper}>
            <MaterialIcons name="search" size={22} color="#10B981" style={styles.searchIcon} />
            <Searchbar
              placeholder="Search jobs, location..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
              iconColor="transparent"
              elevation={0}
            />
          </View>
        </BlurView>

        {/* Categories Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory('')}
            activeOpacity={0.7}
          >
            <BlurView
              intensity={selectedCategory === '' ? 30 : 15}
              tint="light"
              style={[
                styles.categoryChip,
                selectedCategory === '' && styles.categoryChipSelected,
              ]}
            >
              {selectedCategory === '' && (
                <MaterialIcons name="check-circle" size={16} color="#10B981" style={styles.chipIcon} />
              )}
              <Text style={[
                styles.categoryChipText,
                selectedCategory === '' && styles.categoryChipTextSelected
              ]}>
                All
              </Text>
            </BlurView>
          </TouchableOpacity>

          {JOB_CATEGORIES.map(category => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.7}
            >
              <BlurView
                intensity={selectedCategory === category ? 30 : 15}
                tint="light"
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipSelected,
                ]}
              >
                {selectedCategory === category && (
                  <MaterialIcons name="check-circle" size={16} color="#10B981" style={styles.chipIcon} />
                )}
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextSelected
                ]}>
                  {category}
                </Text>
              </BlurView>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Jobs List */}
      <ScrollView
        style={styles.jobsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
      >
        {filteredJobs.map((job) => (
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
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{job.category}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Job Description */}
                  <Text variant="bodyMedium" style={styles.jobDescription} numberOfLines={2}>
                    {job.description}
                  </Text>

                  {/* Job Details */}
                  <View style={styles.jobDetails}>
                    <View style={styles.jobDetailRow}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="location-on" size={16} color="#10B981" />
                      </View>
                      <Text style={styles.jobDetailText}>{job.location}</Text>
                    </View>

                    <View style={styles.jobDetailRow}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="payments" size={16} color="#10B981" />
                      </View>
                      <Text style={styles.jobPayText}>
                        ₹{job.pay_amount} {job.pay_type === 'per_day' ? '/day' : 'total'}
                      </Text>
                    </View>

                    <View style={styles.jobDetailRow}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="group" size={16} color="#10B981" />
                      </View>
                      <Text style={styles.jobDetailText}>
                        {job.workers_needed} worker{job.workers_needed > 1 ? 's' : ''} needed
                      </Text>
                    </View>
                  </View>

                  {/* Provider Info */}
                  {job.profiles && (
                    <View style={styles.providerInfo}>
                      <View style={styles.providerAvatar}>
                        <MaterialIcons name="person" size={16} color="#10B981" />
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

                  {/* View Details Button */}
                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() => router.push(`/jobs/${job.id}`)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#10B981" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          </TouchableOpacity>
        ))}

        {/* Empty State */}
        {filteredJobs.length === 0 && !loading && (
          <BlurView intensity={20} tint="light" style={styles.emptyCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.emptyCardGradient}
            >
              <View style={styles.emptyContent}>
                <View style={styles.emptyIconContainer}>
                  <MaterialIcons name="work-off" size={48} color="#10B981" />
                </View>
                <Text variant="titleLarge" style={styles.emptyTitle}>
                  No jobs found
                </Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  {searchQuery || selectedCategory
                    ? 'Try adjusting your search or filters'
                    : 'No jobs available at the moment'}
                </Text>
                {(searchQuery || selectedCategory) && (
                  <TouchableOpacity
                    onPress={handleClearFilters}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.clearButton}
                    >
                      <Text style={styles.clearButtonText}>Clear Filters</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          </BlurView>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      {profile && (
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
      )}
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
    top: height * 0.4,
    right: -30,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
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
  searchBarContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  searchInput: {
    color: '#1F2937',
    fontSize: 15,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesContent: {
    gap: 8,
    paddingRight: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  categoryChipSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  chipIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#10B981',
    fontWeight: '700',
  },
  jobsList: {
    flex: 1,
    paddingHorizontal: 24,
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
  categoryBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  categoryBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  jobDescription: {
    color: '#6B7280',
    lineHeight: 20,
  },
  jobDetails: {
    gap: 8,
  },
  jobDetailRow: {
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
  jobDetailText: {
    color: '#6B7280',
    fontSize: 14,
    flex: 1,
  },
  jobPayText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.1)',
  },
  providerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  providerName: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '700',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.1)',
    marginTop: 4,
  },
  viewDetailsText: {
    color: '#10B981',
    fontSize: 14,
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
  clearButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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