import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Text, Card, Button, FAB, IconButton, Searchbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useJobs } from '@/hooks/useJobs';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

const getTimeAgo = (date: string) => {
  const now = new Date();
  const posted = new Date(date);
  const diff = now.getTime() - posted.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 24) {
    return `${hours}h ago`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
};

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const { jobs } = useJobs();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(0); // Add this line

  const recentJobs = jobs.slice(0, 4);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!user) return;
      
      try {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('read', false);
          
        setNotificationCount(count || 0);
      } catch (error) {
        console.error('Error fetching notification count:', error);
        setNotificationCount(0);
      }
    };

    fetchNotificationCount();
  }, [user]);

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F9FC" />
        <LinearGradient
          colors={['#F7F9FC', '#E8F7EF']}
          style={styles.unauthGradient}
        >
          <ScrollView contentContainerStyle={styles.unauthContent}>
            <View style={styles.heroSection}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#6DD5A5', '#5BC58F']}
                  style={styles.logoGradient}
                >
                  <MaterialIcons name="agriculture" size={56} color="#FFFFFF" />
                </LinearGradient>
              </View>
              
              <Text variant="displaySmall" style={styles.heroTitle}>
                Gramin KaamConnect
              </Text>
              <Text variant="bodyLarge" style={styles.heroSubtitle}>
                Empowering rural communities through digital work opportunities
              </Text>

              <View style={styles.featureList}>
                {[
                  { icon: 'work', text: 'Find Local Jobs' },
                  { icon: 'post-add', text: 'Post Work Requirements' },
                  { icon: 'handshake', text: 'Connect Directly' },
                  { icon: 'construction', text: 'Rent Equipment' },
                ].map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIconSmall}>
                      <MaterialIcons name={feature.icon} size={18} color="#6DD5A5" />
                    </View>
                    <Text style={styles.featureText}>{feature.text}</Text>
                  </View>
                ))}
              </View>

              <Button
                mode="contained"
                onPress={() => router.push('/auth/login')}
                style={styles.heroButton}
                contentStyle={styles.heroButtonContent}
                labelStyle={styles.heroButtonLabel}
                icon="arrow-right"
              >
                Get Started Free
              </Button>
              
              <TouchableOpacity 
                onPress={() => router.push('/about')}
                style={styles.learnMore}
              >
                <Text style={styles.learnMoreText}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6DD5A5" />
      
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={['#6DD5A5', '#5BC58F']}
        style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
      >
        {/* Add decorative bubbles */}
        <View style={styles.bubbleOne} />
        <View style={styles.bubbleTwo} />
        <View style={styles.bubbleThree} />
        
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="person" size={24} color="#6DD5A5" />
            </TouchableOpacity>
            <View>
              <Text variant="labelSmall" style={styles.greetingLabel}>
                Welcome back 👋
              </Text>
              <Text variant="titleMedium" style={styles.userName}>
                {profile?.full_name?.split(' ')[0] || 'User'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Search Button */}
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => router.push('/search')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Notification Button */}
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => router.push('/notifications')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="notifications-none" size={24} color="#FFFFFF" />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Bar */}
        <TouchableOpacity style={styles.locationBar} activeOpacity={0.8}>
          <MaterialIcons name="location-on" size={18} color="#FFFFFF" />
          <Text style={styles.locationText}>{profile?.village || 'Select Location'}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search jobs, equipment..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            onIconPress={() => router.push('/search')}
            onSubmitEditing={() => router.push('/search')}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor="#6DD5A5"
            elevation={3}
          />
        </View>

        {/* Recent Opportunities */}
        {/* Latest Opportunities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconContainer}>
                <MaterialIcons name="trending-up" size={20} color="#6DD5A5" />
              </View>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Latest Opportunities
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/jobs')}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#6DD5A5" />
            </TouchableOpacity>
          </View>

          {recentJobs.length > 0 ? (
            <>
              {recentJobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/jobs/${job.id}`)}
                >
                  <Card style={styles.jobCard} mode="elevated">
                    <Card.Content style={styles.jobContent}>
                      <View style={styles.jobHeader}>
                        <View style={styles.jobTitleSection}>
                          <Text variant="titleMedium" style={styles.jobTitle} numberOfLines={1}>
                            {job.title}
                          </Text>
                          {job.urgent && (
                            <View style={styles.urgentBadge}>
                              <MaterialIcons name="error-outline" size={12} color="#DC2626" />
                              <Text style={styles.urgentText}>Urgent</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.categoryBadge}>
                          <MaterialIcons name="category" size={12} color="#6DD5A5" />
                          <Text style={styles.categoryText}>{job.category}</Text>
                        </View>
                      </View>

                      <View style={styles.jobDetails}>
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <MaterialIcons name="location-on" size={16} color="#6B7280" />
                            <Text style={styles.detailText}>{job.location}</Text>
                          </View>
                          <View style={styles.detailItem}>
                            <MaterialIcons name="calendar-today" size={14} color="#6B7280" />
                            <Text style={styles.detailText}>
                              {job.duration ? `${job.duration} days` : 'Flexible'}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <MaterialIcons name="group" size={16} color="#6B7280" />
                            <Text style={styles.detailText}>
                              {job.workers_needed} workers needed
                            </Text>
                          </View>
                          <View style={styles.detailItem}>
                            <MaterialIcons name="verified" size={14} color="#6B7280" />
                            <Text style={styles.detailText}>
                              {job.applications_count || 0} applied
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.jobFooter}>
                        <View style={styles.paymentSection}>
                          <View style={styles.payBadge}>
                            <MaterialIcons name="payments" size={16} color="#059669" />
                            <Text style={styles.payAmount}>₹{job.pay_amount}</Text>
                            <Text style={styles.payPeriod}>/{job.pay_type}</Text>
                          </View>
                          <Text style={styles.postedTime}>
                            {getTimeAgo(job.created_at)}
                          </Text>
                        </View>
                        
                        <TouchableOpacity 
                          style={styles.applyButton}
                          onPress={() => router.push(`/jobs/${job.id}`)}
                        >
                          <Text style={styles.applyButtonText}>View Details</Text>
                          <MaterialIcons name="arrow-forward" size={16} color="#6DD5A5" />
                        </TouchableOpacity>
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <Card style={styles.emptyCard} mode="elevated">
              <Card.Content style={styles.emptyContent}>
                <View style={styles.emptyIconContainer}>
                  <MaterialIcons name="work-off" size={56} color="#CBD5E0" />
                </View>
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No jobs available
                </Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  Be the first to post a job in your area!
                </Text>
                <Button
                  mode="contained"
                  onPress={() => router.push('/jobs/post')}
                  style={styles.emptyButton}
                  icon={({ size, color }) => (
                    <MaterialIcons name="add" size={size} color={color} />
                  )}
                >
                  Post a Job
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Equipment Rental Banner */}
        <View style={styles.section}>
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => router.push('/equipment')}
          >
            <Card style={styles.equipmentBanner} mode="elevated">
              <LinearGradient
                colors={['#A78BFA', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.equipmentGradient}
              >
                <View style={styles.equipmentContent}>
                  <View style={styles.equipmentLeft}>
                    <View style={styles.equipmentIconLarge}>
                      <MaterialIcons name="construction" size={32} color="#FFFFFF" />
                    </View>
                    <View style={styles.equipmentText}>
                      <Text style={styles.equipmentTitle}>Equipment Rental</Text>
                      <Text style={styles.equipmentSubtitle}>
                        Rent tools & machinery
                      </Text>
                      <View style={styles.equipmentCTA}>
                        <Text style={styles.equipmentCTAText}>Browse Now</Text>
                        <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
                      </View>
                    </View>
                  </View>
                  <MaterialIcons name="build-circle" size={80} color="rgba(255,255,255,0.2)" />
                </View>
              </LinearGradient>
            </Card>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon={() => <MaterialIcons name="add" size={24} color="#FFFFFF" />}
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
        onPress={() => router.push('/jobs/post')}
        label="Post Job"
        color="#FFFFFF"
        customSize={56}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  unauthGradient: {
    flex: 1,
  },
  unauthContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  heroSection: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#6DD5A5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  heroTitle: {
    color: '#1F2937',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  featureList: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  featureIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  heroButton: {
    minWidth: 240,
    borderRadius: 28,
    backgroundColor: '#6DD5A5',
    elevation: 6,
    shadowColor: '#6DD5A5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  heroButtonContent: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  heroButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  learnMore: {
    marginTop: 20,
    padding: 8,
  },
  learnMoreText: {
    color: '#6DD5A5',
    fontSize: 15,
    fontWeight: '600',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    overflow: 'hidden', // Add this to contain the bubbles
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  greetingLabel: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
    fontSize: 12,
  },
  userName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#6DD5A5',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  locationText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 3,
  },
  searchInput: {
    fontSize: 15,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E8F7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E8F7EF',
    borderRadius: 12,
  },
  seeAllText: {
    color: '#6DD5A5',
    fontWeight: '600',
    fontSize: 13,
  },
  jobCard: {
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  jobContent: {
    padding: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobTitle: {
    color: '#1F2937',
    fontWeight: '700',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#E8F7EF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  categoryText: {
    color: '#6DD5A5',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  jobDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postedTime: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  payBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  payAmount: {
    color: '#059669',
    fontSize: 15,
    fontWeight: 'bold',
  },
  payPeriod: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  applyButtonText: {
    color: '#6DD5A5',
    fontSize: 14,
    fontWeight: '700',
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  timeStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgentText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#374151',
    marginBottom: 8,
    fontWeight: '700',
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyButton: {
    borderRadius: 12,
    backgroundColor: '#6DD5A5',
  },
  equipmentBanner: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  equipmentGradient: {
    padding: 20,
  },
  equipmentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  equipmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  equipmentIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentText: {
    flex: 1,
  },
  equipmentTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  equipmentSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 12,
  },
  equipmentCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  equipmentCTAText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    margin: 0,
    right: 20,
    backgroundColor: '#6DD5A5',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#6DD5A5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  // New styles for the bubble effects
  bubbleOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -30,
    right: -30,
  },
  bubbleTwo: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 40,
    left: -20,
  },
  bubbleThree: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
    bottom: 20,
    right: 40,
  },
});