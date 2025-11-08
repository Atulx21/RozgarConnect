import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Avatar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

interface UserSkill {
  id: string;
  skill_name: string;
  is_verified: boolean;
  jobs_completed: number;
  average_rating: number;
}

interface Stats {
  jobsPosted: number;
  jobsCompleted: number;
  applicationsSubmitted: number;
  jobsHired: number;
}

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState<Stats>({
    jobsPosted: 0,
    jobsCompleted: 0,
    applicationsSubmitted: 0,
    jobsHired: 0,
  });
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && profile) {
      loadProfileData();
    }
  }, [user, profile]);

  const loadProfileData = async () => {
    try {
      await Promise.all([fetchUserStats(), fetchUserSkills()]);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const fetchUserStats = async () => {
    try {
      const [jobsResponse, applicationsResponse] = await Promise.all([
        supabase
          .from('jobs')
          .select('id, status')
          .eq('provider_id', user.id),
        supabase
          .from('applications')
          .select('id, status')
          .eq('worker_id', user.id)
      ]);

      const jobsPosted = jobsResponse.data?.length || 0;
      const jobsCompleted = jobsResponse.data?.filter(job => job.status === 'completed').length || 0;
      const applicationsSubmitted = applicationsResponse.data?.length || 0;
      const jobsHired = applicationsResponse.data?.filter(app => app.status === 'hired').length || 0;

      setStats({ jobsPosted, jobsCompleted, applicationsSubmitted, jobsHired });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchUserSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('is_verified', { ascending: false });

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getAvatarUrl = () => {
    if (profile?.avatar_url) {
      return supabase.storage.from('profiles').getPublicUrl(profile.avatar_url).data.publicUrl;
    }
    return null;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<MaterialIcons key={`full-${i}`} name="star" size={18} color="#FFA500" />);
    }

    if (hasHalfStar && fullStars < 5) {
      stars.push(<MaterialIcons key="half" name="star-half" size={18} color="#FFA500" />);
    }

    const remaining = 5 - stars.length;
    for (let i = 0; i < remaining; i++) {
      stars.push(<MaterialIcons key={`empty-${i}`} name="star-border" size={18} color="#FFA500" />);
    }

    return stars;
  };

  if (!user || !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <MaterialIcons name="person-off" size={64} color="#CBD5E0" />
          </View>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            Please log in
          </Text>
          <Text variant="bodyLarge" style={styles.emptySubtext}>
            Log in to view and manage your profile
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/auth/login')}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
            icon={({ size, color }) => (
              <MaterialIcons name="login" size={size} color={color} />
            )}
          >
            Login
          </Button>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6DD5A5" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6DD5A5']} />
        }
      >
        {/* Header with Gradient and Bubbles */}
        <LinearGradient
          colors={['#6DD5A5', '#4CAF88']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative Bubbles */}
          <View style={styles.bubblesContainer}>
            <View style={[styles.bubble, styles.bubble1]} />
            <View style={[styles.bubble, styles.bubble2]} />
            <View style={[styles.bubble, styles.bubble3]} />
            <View style={[styles.bubble, styles.bubble4]} />
            <View style={[styles.bubble, styles.bubble5]} />
            <View style={[styles.bubble, styles.bubble6]} />
          </View>

          <View style={styles.headerContent}>
            {/* Avatar */}
            <TouchableOpacity
              onPress={() => router.push('/profile/edit')}
              activeOpacity={0.8}
              style={styles.avatarTouchable}
            >
              {getAvatarUrl() ? (
                <View style={styles.avatarWrapper}>
                  <Image source={{ uri: getAvatarUrl() }} style={styles.avatarImage} />
                  <View style={styles.editBadge}>
                    <MaterialIcons name="photo-camera" size={16} color="white" />
                  </View>
                </View>
              ) : (
                <View style={styles.avatarWrapper}>
                  <Avatar.Text
                    size={100}
                    label={profile.full_name?.charAt(0).toUpperCase() || 'U'}
                    style={styles.avatarFallback}
                    labelStyle={styles.avatarLabel}
                  />
                  <View style={styles.editBadge}>
                    <MaterialIcons name="photo-camera" size={16} color="white" />
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Name & Location */}
            <Text variant="headlineMedium" style={styles.profileName}>
              {profile.full_name}
            </Text>

            <View style={styles.locationContainer}>
              <View style={styles.locationBubble}>
                <MaterialIcons name="location-on" size={16} color="white" />
                <Text style={styles.locationText}>{profile.village}</Text>
              </View>
            </View>

            {/* Role Badge */}
            <View style={styles.roleBadge}>
              <MaterialIcons
                name={profile.role === 'worker' ? 'engineering' : 'business'}
                size={16}
                color="white"
              />
              <Text style={styles.roleText}>
                {profile.role === 'worker' ? 'Worker' : 'Work Provider'}
              </Text>
            </View>

            {/* Rating */}
            {profile.rating > 0 && (
              <View style={styles.ratingBubble}>
                <View style={styles.starsContainer}>{renderStars(profile.rating)}</View>
                <Text style={styles.ratingText}>
                  {profile.rating.toFixed(1)} • {profile.total_ratings || 0} reviews
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Stats Overview Card */}
        <View style={styles.statsOverviewCard}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.jobsPosted}</Text>
              <Text style={styles.statLabel}>Posted</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.jobsCompleted}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.applicationsSubmitted}</Text>
              <Text style={styles.statLabel}>Applied</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.jobsHired}</Text>
              <Text style={styles.statLabel}>Hired</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Bio Section */}
          {profile.bio && (
            <Card style={styles.card} mode="elevated">
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="info" size={22} color="#6DD5A5" />
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    About Me
                  </Text>
                </View>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </Card.Content>
            </Card>
          )}

          {/* Experience Badge */}
          {profile.experience_years > 0 && (
            <Card style={styles.experienceCard} mode="elevated">
              <Card.Content style={styles.experienceContent}>
                <View style={styles.experienceIconContainer}>
                  <MaterialIcons name="work-history" size={28} color="#A78BFA" />
                </View>
                <View style={styles.experienceTextContainer}>
                  <Text style={styles.experienceYears}>
                    {profile.experience_years} Years
                  </Text>
                  <Text style={styles.experienceLabel}>Work Experience</Text>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Skills Section */}
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <MaterialIcons name="emoji-objects" size={22} color="#6DD5A5" />
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Skills & Expertise
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/skills/manage')}
                  style={styles.manageButton}
                >
                  <Text style={styles.manageButtonText}>Manage</Text>
                  <MaterialIcons name="chevron-right" size={18} color="#6DD5A5" />
                </TouchableOpacity>
              </View>

              {skills.length > 0 ? (
                <View style={styles.skillsContainer}>
                  {skills.map((skill) => (
                    <Chip
                      key={skill.id}
                      style={[
                        styles.skillChip,
                        skill.is_verified && styles.verifiedSkillChip,
                      ]}
                      textStyle={[
                        styles.skillChipText,
                        skill.is_verified && styles.verifiedSkillText,
                      ]}
                      icon={
                        skill.is_verified
                          ? () => <MaterialIcons name="verified" size={16} color="#6DD5A5" />
                          : undefined
                      }
                    >
                      {skill.skill_name}
                    </Chip>
                  ))}
                </View>
              ) : (
                <View style={styles.emptySection}>
                  <View style={styles.emptySectionIcon}>
                    <MaterialIcons name="psychology" size={40} color="#E2E8F0" />
                  </View>
                  <Text style={styles.emptySectionText}>No skills added yet</Text>
                  <Text style={styles.emptySectionSubtext}>
                    Add skills to showcase your expertise
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => router.push('/skills/manage')}
                    style={styles.addSkillsButton}
                    textColor="#6DD5A5"
                  >
                    Add Skills
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Quick Actions */}
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="apps" size={22} color="#6DD5A5" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Quick Actions
                </Text>
              </View>

              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => router.push('/profile/edit')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, styles.actionIconGreen]}>
                    <MaterialIcons name="edit" size={24} color="#6DD5A5" />
                  </View>
                  <Text style={styles.actionText}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => router.push('/profile/ratings')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, styles.actionIconYellow]}>
                    <MaterialIcons name="star" size={24} color="#FFA500" />
                  </View>
                  <Text style={styles.actionText}>Reviews</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => router.push('/jobs/my-jobs')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, styles.actionIconBlue]}>
                    <MaterialIcons name="work" size={24} color="#60C5F4" />
                  </View>
                  <Text style={styles.actionText}>My Jobs</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => router.push('/equipment/my-equipment')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, styles.actionIconPurple]}>
                    <MaterialIcons name="construction" size={24} color="#A78BFA" />
                  </View>
                  <Text style={styles.actionText}>Equipment</Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>

          {/* Additional Actions */}
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => router.push('/stats')}
                activeOpacity={0.7}
              >
                <View style={styles.listItemLeft}>
                  <MaterialIcons name="bar-chart" size={24} color="#6DD5A5" />
                  <Text style={styles.listItemText}>Statistics & Analytics</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#CBD5E0" />
              </TouchableOpacity>

              <View style={styles.listDivider} />

              <TouchableOpacity
                style={styles.listItem}
                onPress={() => router.push('/settings')}
                activeOpacity={0.7}
              >
                <View style={styles.listItemLeft}>
                  <MaterialIcons name="settings" size={24} color="#718096" />
                  <Text style={styles.listItemText}>Settings</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#CBD5E0" />
              </TouchableOpacity>

              <View style={styles.listDivider} />

              <TouchableOpacity
                style={styles.listItem}
                onPress={() => router.push('/help')}
                activeOpacity={0.7}
              >
                <View style={styles.listItemLeft}>
                  <MaterialIcons name="help" size={24} color="#718096" />
                  <Text style={styles.listItemText}>Help & Support</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#CBD5E0" />
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* Sign Out Button */}
          <Button
            mode="outlined"
            onPress={handleSignOut}
            style={styles.signOutButton}
            contentStyle={styles.signOutButtonContent}
            textColor="#EF4444"
            icon={({ size }) => <MaterialIcons name="logout" size={size} color="#EF4444" />}
          >
            Sign Out
          </Button>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
  },
  loadingText: {
    marginTop: 16,
    color: '#718096',
    fontSize: 16,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bubblesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bubble1: {
    width: 120,
    height: 120,
    top: -40,
    right: -20,
  },
  bubble2: {
    width: 80,
    height: 80,
    top: 60,
    left: -25,
  },
  bubble3: {
    width: 100,
    height: 100,
    bottom: 20,
    right: 40,
  },
  bubble4: {
    width: 60,
    height: 60,
    top: 120,
    right: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bubble5: {
    width: 140,
    height: 140,
    bottom: -50,
    left: -40,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  bubble6: {
    width: 50,
    height: 50,
    top: 180,
    left: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  avatarTouchable: {
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarLabel: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF88',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  profileName: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
  },
  locationText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  ratingBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 8,
  },
  ratingText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  statsOverviewCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  content: {
    padding: 20,
  },
  card: {
    borderRadius: 20,
    backgroundColor: 'white',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
    gap: 8,
  },
  sectionTitle: {
    color: '#2D3748',
    fontWeight: 'bold',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#6DD5A5',
    fontSize: 14,
    fontWeight: '600',
  },
  bioText: {
    color: '#4A5568',
    fontSize: 15,
    lineHeight: 24,
  },
  experienceCard: {
    borderRadius: 20,
    backgroundColor: 'white',
    marginBottom: 16,
    elevation: 2,
  },
  experienceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  experienceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  experienceTextContainer: {
    flex: 1,
  },
  experienceYears: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 2,
  },
  experienceLabel: {
    fontSize: 14,
    color: '#718096',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillChip: {
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skillChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  verifiedSkillChip: {
    backgroundColor: '#E8F7EF',
    borderColor: '#6DD5A5',
  },
  verifiedSkillText: {
    color: '#6DD5A5',
    fontWeight: '600',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptySectionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptySectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
  },
  emptySectionSubtext: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
    marginBottom: 20,
  },
  addSkillsButton: {
    borderRadius: 12,
    borderColor: '#6DD5A5',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionItem: {
    width: '48%',
    backgroundColor: '#F7FAFC',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIconGreen: {
    backgroundColor: '#E8F7EF',
  },
  actionIconYellow: {
    backgroundColor: '#FFF7ED',
  },
  actionIconBlue: {
    backgroundColor: '#E6F7FC',
  },
  actionIconPurple: {
    backgroundColor: '#F3F0FF',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3748',
  },
  listDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  signOutButton: {
    borderRadius: 16,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    marginTop: 8,
  },
  signOutButtonContent: {
    paddingVertical: 8,
  },
  bottomSpacing: {
    height: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    color: '#2D3748',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptySubtext: {
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loginButton: {
    borderRadius: 16,
    backgroundColor: '#6DD5A5',
    elevation: 3,
    shadowColor: '#6DD5A5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  loginButtonContent: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
});