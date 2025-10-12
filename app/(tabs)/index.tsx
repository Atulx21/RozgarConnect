import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, FAB } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useJobs } from '@/hooks/useJobs';

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const { jobs } = useJobs();

  const recentJobs = jobs.slice(0, 3);

  if (!user) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.unauthContent}>
          <View style={styles.heroSection}>
            <Text variant="displaySmall" style={styles.heroTitle}>
              Gramin KaamConnect
            </Text>
            <Text variant="bodyLarge" style={styles.heroSubtitle}>
              Connect with local work opportunities in your village
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/auth/login')}
              style={styles.heroButton}
              contentStyle={styles.heroButtonContent}
            >
              Get Started
            </Button>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.greeting}>
            Namaste, {profile?.full_name || 'User'}!
          </Text>
          <View style={styles.locationBadge}>
            <MaterialIcons name="location-on" size={16} color="#6DD5A5" />
            <Text variant="bodyMedium" style={styles.location}>
              {profile?.village}
            </Text>
          </View>
        </View>

        <Card style={styles.actionCard} mode="elevated">
          <Card.Content>
            <Text variant="titleLarge" style={styles.actionTitle}>
              What would you like to do today?
            </Text>
            <View style={styles.quickActions}>
              <Button
                mode="contained"
                onPress={() => router.push('/jobs/post')}
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
                icon={({ size, color }) => (
                  <MaterialIcons name="add-circle" size={size} color={color} />
                )}
              >
                Post a Job
              </Button>
              <Button
                mode="contained-tonal"
                onPress={() => router.push('/jobs')}
                style={styles.secondaryButton}
                contentStyle={styles.buttonContent}
                icon={({ size, color }) => (
                  <MaterialIcons name="search" size={size} color={color} />
                )}
              >
                Find Work
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Recent Opportunities
            </Text>
            <MaterialIcons name="work-outline" size={24} color="#6DD5A5" />
          </View>

          {recentJobs.length > 0 ? (
            <>
              {recentJobs.map((job) => (
                <Card key={job.id} style={styles.jobCard} mode="elevated">
                  <Card.Content>
                    <View style={styles.jobHeader}>
                      <View style={styles.jobTitleContainer}>
                        <Text variant="titleMedium" style={styles.jobTitle}>
                          {job.title}
                        </Text>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{job.category}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.jobDetails}>
                      <View style={styles.jobDetailItem}>
                        <MaterialIcons name="location-on" size={18} color="#718096" />
                        <Text variant="bodyMedium" style={styles.jobDetailText}>
                          {job.location}
                        </Text>
                      </View>
                      <View style={styles.jobDetailItem}>
                        <MaterialIcons name="payments" size={18} color="#6DD5A5" />
                        <Text variant="bodyMedium" style={styles.payText}>
                          ₹{job.pay_amount} {job.pay_type === 'per_day' ? '/day' : 'total'}
                        </Text>
                      </View>
                      <View style={styles.jobDetailItem}>
                        <MaterialIcons name="group" size={18} color="#718096" />
                        <Text variant="bodyMedium" style={styles.jobDetailText}>
                          {job.workers_needed} needed
                        </Text>
                      </View>
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
              <Button
                mode="outlined"
                onPress={() => router.push('/jobs')}
                style={styles.viewAllButton}
                contentStyle={styles.buttonContent}
              >
                View All Jobs
              </Button>
            </>
          ) : (
            <Card style={styles.emptyCard} mode="elevated">
              <Card.Content style={styles.emptyContent}>
                <MaterialIcons name="work-off" size={48} color="#CBD5E0" />
                <Text variant="bodyLarge" style={styles.emptyText}>
                  No jobs available at the moment
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Check back later or post your own job!
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Equipment Rental
            </Text>
            <MaterialIcons name="construction" size={24} color="#A78BFA" />
          </View>

          <Card style={styles.featureCard} mode="elevated">
            <Card.Content>
              <View style={styles.featureIcon}>
                <MaterialIcons name="handyman" size={32} color="#A78BFA" />
              </View>
              <Text variant="titleMedium" style={styles.featureTitle}>
                Rent or List Equipment
              </Text>
              <Text variant="bodyMedium" style={styles.featureDescription}>
                Find equipment for your projects or list your own equipment for rent
              </Text>
            </Card.Content>
            <Card.Actions style={styles.featureActions}>
              <Button
                mode="text"
                onPress={() => router.push('/equipment')}
                textColor="#A78BFA"
              >
                Browse
              </Button>
              <Button
                mode="contained"
                onPress={() => router.push('/equipment/add')}
                buttonColor="#A78BFA"
              >
                List Equipment
              </Button>
            </Card.Actions>
          </Card>
        </View>

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
  unauthContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  heroSection: {
    alignItems: 'center',
  },
  heroTitle: {
    color: '#2D3748',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    color: '#718096',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  heroButton: {
    minWidth: 200,
    borderRadius: 20,
    backgroundColor: '#6DD5A5',
  },
  heroButtonContent: {
    paddingVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    color: '#2D3748',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F7EF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  location: {
    color: '#2D3748',
    marginLeft: 4,
  },
  actionCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#6DD5A5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  actionTitle: {
    color: '#2D3748',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  quickActions: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    backgroundColor: '#6DD5A5',
  },
  secondaryButton: {
    borderRadius: 16,
    backgroundColor: '#F3F0FF',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#2D3748',
    fontWeight: 'bold',
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
    color: '#2D3748',
    fontWeight: 'bold',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#E8F7EF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#6DD5A5',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  jobDetails: {
    gap: 8,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobDetailText: {
    color: '#718096',
  },
  payText: {
    color: '#6DD5A5',
    fontWeight: '600',
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  viewAllButton: {
    borderRadius: 16,
    borderColor: '#6DD5A5',
    marginTop: 8,
  },
  emptyCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#718096',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#A0AEC0',
    marginTop: 8,
    textAlign: 'center',
  },
  featureCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    color: '#2D3748',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureDescription: {
    color: '#718096',
    lineHeight: 20,
  },
  featureActions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'flex-end',
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
