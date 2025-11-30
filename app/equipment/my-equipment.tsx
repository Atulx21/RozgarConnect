import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image, Pressable, Dimensions } from 'react-native';
import { Text, Card, Button, Chip, FAB, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { height } = Dimensions.get('window');

const COLORS = {
  primary: '#A78BFA',
  primaryDark: '#8B5CF6',
  secondary: '#6366F1',
  accent: '#EC4899',
  background: '#FAF5FF',
  surface: '#FFFFFF',
  border: 'rgba(167, 139, 250, 0.1)',
  text: '#1F2937',
  textSecondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  rented: '#FF9800',
  maintenance: '#F44336',
};

export default function MyEquipmentScreen() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyEquipment();
    }
  }, [user]);

  const fetchMyEquipment = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          equipment_bookings (
            id,
            status,
            start_date,
            end_date,
            profiles:renter_id (full_name)
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Equipment table not found or error:', error.message);
        setEquipment([]);
      } else {
        setEquipment(data || []);
      }
    } catch (error) {
      console.error('Error fetching my equipment:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rented':
        return COLORS.rented;
      case 'maintenance':
        return COLORS.maintenance;
      default:
        return COLORS.success;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rented':
        return 'clock-outline';
      case 'maintenance':
        return 'wrench';
      default:
        return 'check-circle';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'rented':
        return 'Currently Rented';
      case 'maintenance':
        return 'Under Maintenance';
      default:
        return 'Available';
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyEquipment();
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FAF5FF', '#F3E8FF', '#EDE9FE']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.blurCircle, styles.blurCircle1]} />
        <View style={[styles.blurCircle, styles.blurCircle2]} />

        <View style={styles.unauthState}>
          <BlurView intensity={20} tint="light" style={styles.unauthCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.unauthCardGradient}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="lock" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.unauthTitle}>
                Login Required
              </Text>
              <Text style={styles.unauthText}>
                Please log in to view your equipment
              </Text>
              <Pressable
                onPress={() => router.push('/auth/login')}
                style={({ pressed }) => [styles.loginButton, pressed && styles.loginButtonPressed]}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={styles.loginButtonGradient}
                >
                  <Text style={styles.loginButtonText}>Login</Text>
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          </BlurView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FAF5FF', '#F3E8FF', '#EDE9FE']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={[styles.blurCircle, styles.blurCircle1]} />
      <View style={[styles.blurCircle, styles.blurCircle2]} />
      <View style={[styles.blurCircle, styles.blurCircle3]} />

      {/* Modern Header */}
      <BlurView intensity={20} tint="light" style={styles.headerContainer}>
        <LinearGradient
          colors={['rgba(167, 139, 250, 0.1)', 'rgba(139, 92, 246, 0.05)']}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>My Equipment</Text>
              <Text style={styles.headerSubtitle}>Manage your rental inventory</Text>
            </View>
          </View>
        </LinearGradient>
      </BlurView>

      <ScrollView
        style={styles.equipmentList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.surface}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your equipment...</Text>
          </View>
        ) : equipment.length === 0 ? (
          <BlurView intensity={20} tint="light" style={styles.emptyCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.emptyCardGradient}
            >
              <View style={styles.emptyContent}>
                <View style={styles.emptyIconContainer}>
                  <MaterialCommunityIcons name="package-open" size={52} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>
                  No Equipment Listed
                </Text>
                <Text style={styles.emptySubtitle}>
                  Start earning by listing your equipment for rent
                </Text>
                <Pressable
                  onPress={() => router.push('/equipment/add')}
                  style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.emptyButtonGradient}
                  >
                    <MaterialCommunityIcons name="plus-circle" size={22} color={COLORS.surface} />
                    <Text style={styles.emptyButtonText}>Add Your First Equipment</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </BlurView>
        ) : (
          equipment.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/equipment/${item.id}`)}
              style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}
            >
              <BlurView intensity={20} tint="light" style={styles.equipmentCard}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                  style={styles.cardGradient}
                >
                  {/* Equipment Image */}
                  <View style={styles.imageContainer}>
                    {item.photos?.[0] ? (
                      <>
                        <Image
                          source={{
                            uri: item.photos[0].startsWith('http')
                              ? item.photos[0]
                              : supabase.storage
                                  .from('equipment')
                                  .getPublicUrl(item.photos[0]).data.publicUrl,
                          }}
                          style={styles.image}
                          resizeMode="cover"
                        />
                        <View style={styles.imageOverlay}>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: getStatusColor(item.status) },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={getStatusIcon(item.status)}
                              size={16}
                              color={COLORS.surface}
                            />
                            <Text style={styles.statusBadgeText}>
                              {getStatusText(item.status)}
                            </Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      <View style={styles.noImage}>
                        <MaterialCommunityIcons
                          name="image-off"
                          size={40}
                          color={COLORS.primary}
                        />
                        <Text style={styles.noImageText}>No photo</Text>
                      </View>
                    )}
                  </View>

                  {/* Card Content */}
                  <View style={styles.cardContent}>
                    {/* Header */}
                    <View style={styles.cardHeader}>
                      <View style={styles.titleSection}>
                        <Text style={styles.equipmentName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <View style={styles.typeChip}>
                          <MaterialCommunityIcons
                            name="tag"
                            size={14}
                            color={COLORS.primary}
                          />
                          <Text style={styles.typeChipText}>
                            {item.equipment_type}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Details */}
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailItem}>
                        <View style={styles.detailIconBox}>
                          <MaterialCommunityIcons
                            name="map-marker"
                            size={18}
                            color={COLORS.primary}
                          />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Location</Text>
                          <Text style={styles.detailValue} numberOfLines={1}>
                            {item.location}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailItem}>
                        <View style={styles.detailIconBox}>
                          <MaterialCommunityIcons
                            name="currency-inr"
                            size={18}
                            color={COLORS.secondary}
                          />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Price</Text>
                          <Text style={styles.detailValue}>
                            ₹{item.rental_price}/{item.price_type === 'per_hour' ? 'hr' : 'day'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailItem}>
                        <View style={styles.detailIconBox}>
                          <MaterialCommunityIcons
                            name="calendar-clock"
                            size={18}
                            color={COLORS.accent}
                          />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Bookings</Text>
                          <Text style={styles.detailValue}>
                            {item.equipment_bookings?.length || 0} request{item.equipment_bookings?.length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.description} numberOfLines={2}>
                      {item.description}
                    </Text>

                    {/* Stats */}
                    <View style={styles.statsContainer}>
                      <View style={styles.statBox}>
                        <Text style={styles.statValue}>
                          {item.equipment_bookings?.filter(b => b.status === 'confirmed').length || 0}
                        </Text>
                        <Text style={styles.statLabel}>Confirmed</Text>
                      </View>
                      <View style={[styles.statBox, styles.statBoxBorder]}>
                        <Text style={styles.statValue}>
                          {item.equipment_bookings?.filter(b => b.status === 'pending').length || 0}
                        </Text>
                        <Text style={styles.statLabel}>Pending</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statValue}>
                          {item.availability_start && new Date(item.availability_end) > new Date()
                            ? Math.ceil(
                                (new Date(item.availability_end).getTime() - new Date().getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            : 0}
                        </Text>
                        <Text style={styles.statLabel}>Days Left</Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <Pressable
                        onPress={() => router.push(`/equipment/${item.id}`)}
                        style={({ pressed }) => [
                          styles.actionButton,
                          styles.actionButtonOutline,
                          pressed && styles.actionButtonPressed,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="information"
                          size={18}
                          color={COLORS.primary}
                        />
                        <Text style={styles.actionButtonTextOutline}>Details</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => router.push(`/equipment/${item.id}/bookings`)}
                        style={({ pressed }) => [
                          styles.actionButton,
                          styles.actionButtonFilled,
                          pressed && styles.actionButtonFilledPressed,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="calendar-check"
                          size={18}
                          color={COLORS.surface}
                        />
                        <Text style={styles.actionButtonTextFilled}>
                          Bookings ({item.equipment_bookings?.length || 0})
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </LinearGradient>
              </BlurView>
            </Pressable>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        onPress={() => router.push('/equipment/add')}
        style={({ pressed }) => [styles.fabContainer, pressed && styles.fabContainerPressed]}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.fab}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="plus" size={28} color={COLORS.surface} />
          <Text style={styles.fabText}>Add</Text>
        </LinearGradient>
      </Pressable>
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
    backgroundColor: 'rgba(167, 139, 250, 0.06)',
  },
  blurCircle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -80,
  },
  blurCircle2: {
    width: 250,
    height: 250,
    bottom: 150,
    left: -60,
  },
  blurCircle3: {
    width: 200,
    height: 200,
    top: height * 0.45,
    right: -40,
  },
  headerContainer: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167, 139, 250, 0.15)',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  equipmentList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  pressable: {
    marginBottom: 16,
  },
  pressablePressed: {
    opacity: 0.8,
  },
  equipmentCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardGradient: {
    borderRadius: 16,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statusBadgeText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  noImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
  },
  noImageText: {
    marginTop: 8,
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    marginBottom: 4,
  },
  titleSection: {
    gap: 8,
  },
  equipmentName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    gap: 6,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  detailsGrid: {
    gap: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginVertical: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 0,
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statBoxBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: COLORS.border,
    borderRightColor: COLORS.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonOutline: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  actionButtonFilled: {
    backgroundColor: COLORS.primary,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonFilledPressed: {
    opacity: 0.85,
  },
  actionButtonTextOutline: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  actionButtonTextFilled: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 60,
    marginHorizontal: 20,
  },
  emptyCardGradient: {
    padding: 40,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 10,
  },
  emptyButtonPressed: {
    opacity: 0.9,
  },
  emptyButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  unauthState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unauthCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unauthCardGradient: {
    padding: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unauthTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  unauthText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginButtonPressed: {
    opacity: 0.9,
  },
  loginButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  fabContainerPressed: {
    opacity: 0.9,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  fabText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
  },
});