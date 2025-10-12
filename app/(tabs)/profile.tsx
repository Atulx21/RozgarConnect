import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Divider, Avatar, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface UserSkill {
  id: string;
  skill_name: string;
  is_verified: boolean;
  jobs_completed: number;
  average_rating: number;
}

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState({
    jobsPosted: 0,
    jobsCompleted: 0,
    applicationsSubmitted: 0,
    jobsHired: 0,
  });
  const [skills, setSkills] = useState<UserSkill[]>([]);

  useEffect(() => {
    if (user && profile) {
      fetchUserStats();
      fetchUserSkills();
    }
  }, [user, profile]);

  const fetchUserStats = async () => {
    try {
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, status')
        .eq('provider_id', user.id);

      const { data: applicationsData } = await supabase
        .from('applications')
        .select('id, status')
        .eq('worker_id', user.id);

      const jobsPosted = jobsData?.length || 0;
      const jobsCompleted = jobsData?.filter(job => job.status === 'completed').length || 0;
      const applicationsSubmitted = applicationsData?.length || 0;
      const jobsHired = applicationsData?.filter(app => app.status === 'hired').length || 0;

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

  if (!user || !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialIcons name="person-off" size={64} color="#CBD5E0" />
          <Text variant="titleLarge" style={styles.emptyTitle}>
            Please log in
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Log in to view your profile
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/auth/login')}
            style={styles.loginButton}
          >
            Login
          </Button>
        </View>
      </View>
    );
  }

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<MaterialIcons key={i} name="star" size={16} color="#FFA500" />);
    }

    if (hasHalfStar) {
      stars.push(<MaterialIcons key="half" name="star-half" size={16} color="#FFA500" />);
    }

    for (let i = stars.length; i < 5; i++) {
      stars.push(<MaterialIcons key={i} name="star-border" size={16} color="#FFA500" />);
    }

    return stars;
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Card style={styles.profileCard} mode="elevated">
            <Card.Content style={styles.profileContent}>
              <View style={styles.avatarContainer}>
                <Avatar.Text
                  size={80}
                  label={profile.full_name.charAt(0).toUpperCase()}
                  style={styles.avatar}
                  labelStyle={styles.avatarLabel}
                />
              </View>

              <Text variant="headlineSmall" style={styles.name}>
                {profile.full_name}
              </Text>

              <View style={styles.locationBadge}>
                <MaterialIcons name="location-on" size={16} color="#6DD5A5" />
                <Text variant="bodyMedium" style={styles.village}>
                  {profile.village}
                </Text>
              </View>

              {profile.experience_years > 0 && (
                <View style={styles.experienceBadge}>
                  <MaterialIcons name="work" size={16} color="#A78BFA" />
                  <Text variant="bodySmall" style={styles.experienceText}>
                    {profile.experience_years} years experience
                  </Text>
                </View>
              )}

              <View style={styles.ratingContainer}>
                <View style={styles.stars}>{renderStars(profile.rating)}</View>
                <Text style={styles.ratingText}>
                  {profile.rating.toFixed(1)} ({profile.total_ratings} reviews)
                </Text>
              </View>

              {profile.bio && (
                <Text variant="bodyMedium" style={styles.bio}>
                  {profile.bio}
                </Text>
              )}
            </Card.Content>
          </Card>
        </View>

        <View style={styles.section}>
          <Card style={styles.skillsCard} mode="elevated">
            <Card.Content>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <MaterialIcons name="emoji-objects" size={24} color="#6DD5A5" />
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Skills
                  </Text>
                </View>
                <Button
                  mode="text"
                  onPress={() => router.push('/skills/manage')}
                  compact
                  textColor="#6DD5A5"
                >
                  Manage
                </Button>
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
                      textStyle={skill.is_verified && styles.verifiedSkillText}
                      icon={skill.is_verified ? 'check-circle' : undefined}
                    >
                      {skill.skill_name}
                    </Chip>
                  ))}
                </View>
              ) : (
                <View style={styles.emptySection}>
                  <MaterialIcons name="psychology" size={32} color="#CBD5E0" />
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    No skills added yet
                  </Text>
                  <Text variant="bodySmall" style={styles.emptySubtext}>
                    Add skills to showcase your expertise!
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </View>

        <View style={styles.section}>
          <Card style={styles.statsCard} mode="elevated">
            <Card.Content>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <MaterialIcons name="analytics" size={24} color="#A78BFA" />
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Activity
                  </Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, styles.statIconGreen]}>
                    <MaterialIcons name="work" size={24} color="#6DD5A5" />
                  </View>
                  <Text variant="headlineSmall" style={styles.statNumber}>
                    {stats.jobsPosted}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Jobs Posted
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <View style={[styles.statIcon, styles.statIconGreen]}>
                    <MaterialIcons name="check-circle" size={24} color="#6DD5A5" />
                  </View>
                  <Text variant="headlineSmall" style={styles.statNumber}>
                    {stats.jobsCompleted}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Completed
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <View style={[styles.statIcon, styles.statIconBlue]}>
                    <MaterialIcons name="assignment" size={24} color="#60C5F4" />
                  </View>
                  <Text variant="headlineSmall" style={styles.statNumber}>
                    {stats.applicationsSubmitted}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Applications
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <View style={[styles.statIcon, styles.statIconBlue]}>
                    <MaterialIcons name="thumb-up" size={24} color="#60C5F4" />
                  </View>
                  <Text variant="headlineSmall" style={styles.statNumber}>
                    {stats.jobsHired}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Times Hired
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.section}>
          <Card style={styles.actionsCard} mode="elevated">
            <Card.Content>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <MaterialIcons name="menu" size={24} color="#2D3748" />
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Quick Actions
                  </Text>
                </View>
              </View>

              <View style={styles.actionsList}>
                <Button
                  mode="outlined"
                  onPress={() => router.push('/profile/edit')}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  icon={({ size, color }) => (
                    <MaterialIcons name="edit" size={size} color={color} />
                  )}
                >
                  Edit Profile
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => router.push('/profile/ratings')}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  icon={({ size, color }) => (
                    <MaterialIcons name="star" size={size} color={color} />
                  )}
                >
                  Ratings & Reviews
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => router.push('/jobs/my-jobs')}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  icon={({ size, color }) => (
                    <MaterialIcons name="work" size={size} color={color} />
                  )}
                >
                  My Posted Jobs
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => router.push('/equipment/my-equipment')}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  icon={({ size, color }) => (
                    <MaterialIcons name="construction" size={size} color={color} />
                  )}
                >
                  My Equipment
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => router.push('/stats')}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  icon={({ size, color }) => (
                    <MaterialIcons name="bar-chart" size={size} color={color} />
                  )}
                >
                  Statistics
                </Button>

                <Button
                  mode="outlined"
                  onPress={handleSignOut}
                  style={[styles.actionButton, styles.signOutButton]}
                  contentStyle={styles.actionButtonContent}
                  textColor="#EF4444"
                  icon={({ size }) => (
                    <MaterialIcons name="logout" size={size} color="#EF4444" />
                  )}
                >
                  Sign Out
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  profileCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#6DD5A5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: '#6DD5A5',
  },
  avatarLabel: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    color: '#2D3748',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F7EF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  village: {
    color: '#2D3748',
    marginLeft: 6,
    fontWeight: '500',
  },
  experienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  experienceText: {
    color: '#A78BFA',
    marginLeft: 6,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '500',
  },
  bio: {
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  skillsCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statsCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  actionsCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: '#2D3748',
    fontWeight: 'bold',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
  },
  verifiedSkillChip: {
    backgroundColor: '#E8F7EF',
  },
  verifiedSkillText: {
    color: '#6DD5A5',
    fontWeight: '600',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: '#718096',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#A0AEC0',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statIconGreen: {
    backgroundColor: '#E8F7EF',
  },
  statIconBlue: {
    backgroundColor: '#E6F7FC',
  },
  statNumber: {
    color: '#2D3748',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#718096',
    textAlign: 'center',
  },
  actionsList: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 16,
    borderColor: '#E2E8F0',
  },
  actionButtonContent: {
    paddingVertical: 6,
  },
  signOutButton: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  loginButton: {
    marginTop: 24,
    borderRadius: 20,
    backgroundColor: '#6DD5A5',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#2D3748',
    fontWeight: 'bold',
    marginTop: 16,
  },
});
