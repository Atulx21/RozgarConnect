import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  type: 'application' | 'hired' | 'job_completed' | 'rating_received';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  related_id?: string;
}

export default function NotificationsScreen() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      generateNotifications();
    }
  }, [user, profile]);

  const generateNotifications = async () => {
    try {
      const mockNotifications: Notification[] = [];

      if (profile?.role === 'provider') {
        // Check for new applications
        const { data: applications, error } = await supabase
          .from('applications')
          .select(`
            *,
            jobs!inner (title),
            profiles:worker_id (full_name)
          `)
          .eq('jobs.provider_id', user.id)
          .eq('status', 'pending')
          .order('applied_at', { ascending: false })
          .limit(5);

        if (!error && applications) {
          applications.forEach(app => {
            mockNotifications.push({
              id: `app-${app.id}`,
              type: 'application',
              title: 'New Job Application',
              message: `${app.profiles.full_name} applied for "${app.jobs.title}"`,
              read: false,
              created_at: app.applied_at,
              related_id: app.job_id,
            });
          });
        }
      } else {
        // Check for hired applications
        const { data: hiredApps, error } = await supabase
          .from('applications')
          .select(`
            *,
            jobs (title, profiles:provider_id (full_name))
          `)
          .eq('worker_id', user.id)
          .eq('status', 'hired')
          .order('applied_at', { ascending: false })
          .limit(5);

        if (!error && hiredApps) {
          hiredApps.forEach(app => {
            mockNotifications.push({
              id: `hired-${app.id}`,
              type: 'hired',
              title: 'You got hired!',
              message: `${app.jobs.profiles.full_name} hired you for "${app.jobs.title}"`,
              read: false,
              created_at: app.applied_at,
              related_id: app.job_id,
            });
          });
        }
      }

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error generating notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return 'assignment';
      case 'hired':
        return 'work';
      case 'job_completed':
        return 'check-circle';
      case 'rating_received':
        return 'star';
      default:
        return 'notifications';
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.related_id) {
      router.push(`/jobs/${notification.related_id}`);
    }
  };

  const onRefresh = () => {
    generateNotifications();
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="titleMedium">Please log in to view notifications</Text>
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
        <Text variant="headlineSmall" style={styles.title}>
          Notifications
        </Text>
        {notifications.filter(n => !n.read).length > 0 && (
          <Chip mode="outlined" compact style={styles.unreadChip}>
            {notifications.filter(n => !n.read).length} new
          </Chip>
        )}
      </View>

      <ScrollView 
        style={styles.notificationsList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="notifications-none" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Notifications
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              You'll see updates about your jobs and applications here
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadCard
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <Card.Content>
                <View style={styles.notificationHeader}>
                  <MaterialIcons 
                    name={getNotificationIcon(notification.type)} 
                    size={24} 
                    color="#4caf50" 
                  />
                  <View style={styles.notificationContent}>
                    <Text variant="titleMedium" style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    <Text variant="bodyMedium" style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {new Date(notification.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {!notification.read && (
                    <View style={styles.unreadDot} />
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  unreadChip: {
    backgroundColor: '#e8f5e8',
  },
  notificationsList: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
    padding: 40,
  },
  emptyTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: '#666',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#999',
  },
  notificationCard: {
    marginBottom: 10,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#f0f8f0',
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 15,
  },
  notificationTitle: {
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationMessage: {
    color: '#666',
    marginBottom: 8,
  },
  notificationTime: {
    color: '#888',
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
    marginLeft: 10,
    marginTop: 5,
  },
});