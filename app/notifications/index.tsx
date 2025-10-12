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
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      // For now, we'll create mock notifications since we don't have a notifications table
      // In a real app, you'd fetch from a notifications table
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'application',
          title: 'New Job Application',
          message: 'Someone applied for your farming job',
          read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'hired',
          title: 'You got hired!',
          message: 'You have been selected for the construction job',
          read: false,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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

  const onRefresh = () => {
    fetchNotifications();
  };

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
          Notifications
        </Text>
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
              onPress={() => markAsRead(notification.id)}
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
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  title: {
    color: '#2e7d32',
    fontWeight: 'bold',
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