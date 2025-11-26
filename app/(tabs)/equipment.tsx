// Top-level imports
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useEquipment } from '@/hooks/useEquipment';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import type { Equipment } from '@/hooks/useEquipment';
import { supabase } from '@/lib/supabase';

const { height } = Dimensions.get('window');

const EQUIPMENT_TYPES = ['Tractor', 'Water Pump', 'Thresher', 'Harvester', 'Plough', 'Other'];

export default function EquipmentScreen() {
  const { user, profile } = useAuth();
  const { equipment, loading, error, refreshEquipment } = useEquipment();
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    filterEquipment();
  }, [equipment, searchQuery, selectedType]);

  const filterEquipment = () => {
    let filtered = equipment as Equipment[];

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter(item => item.equipment_type === selectedType);
    }

    setFilteredEquipment(filtered);
  };

  const onRefresh = () => {
    refreshEquipment();
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
                <MaterialIcons name="construction" size={48} color="#A78BFA" />
              </View>
              <Text variant="titleLarge" style={styles.unauthTitle}>
                Login Required
              </Text>
              <Text variant="bodyMedium" style={styles.unauthText}>
                Please log in to rent equipment
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/auth/login')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#A78BFA', '#8B5CF6']}
                  style={styles.loginButton}
                >
                  <Text style={styles.loginButtonText}>Login</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </BlurView>
        </View>
      </View>
    );
  }

  if (loading && equipment.length === 0) {
    return <LoadingSpinner message="Loading available equipment..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Unable to Load Equipment"
        message={error}
        onRetry={refreshEquipment}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Background with Subtle Blurred Circles */}
      <LinearGradient
        colors={['#FAF5FF', '#F3E8FF', '#EDE9FE']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Subtle Blurred Accent Circles */}
      <View style={[styles.blurCircle, styles.blurCircle1]} />
      <View style={[styles.blurCircle, styles.blurCircle2]} />
      <View style={[styles.blurCircle, styles.blurCircle3]} />

      {/* Header Section */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Rent Equipment
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Find tools and machinery for your needs
        </Text>

        {/* Search Bar with Blur */}
        <BlurView intensity={20} tint="light" style={styles.searchBarContainer}>
          <View style={styles.searchBarWrapper}>
            <MaterialIcons name="search" size={22} color="#A78BFA" style={styles.searchIcon} />
            <Searchbar
              placeholder="Search equipment, location..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
              iconColor="transparent"
              elevation={0}
            />
          </View>
        </BlurView>

        {/* Types Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typesContainer}
          contentContainerStyle={styles.typesContent}
        >
          <TouchableOpacity
            onPress={() => setSelectedType('')}
            activeOpacity={0.7}
          >
            <BlurView
              intensity={selectedType === '' ? 30 : 15}
              tint="light"
              style={[
                styles.typeChip,
                selectedType === '' && styles.typeChipSelected,
              ]}
            >
              {selectedType === '' && (
                <MaterialIcons name="check-circle" size={16} color="#A78BFA" style={styles.chipIcon} />
              )}
              <Text style={[
                styles.typeChipText,
                selectedType === '' && styles.typeChipTextSelected
              ]}>
                All
              </Text>
            </BlurView>
          </TouchableOpacity>

          {EQUIPMENT_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedType(type)}
              activeOpacity={0.7}
            >
              <BlurView
                intensity={selectedType === type ? 30 : 15}
                tint="light"
                style={[
                  styles.typeChip,
                  selectedType === type && styles.typeChipSelected,
                ]}
              >
                {selectedType === type && (
                  <MaterialIcons name="check-circle" size={16} color="#A78BFA" style={styles.chipIcon} />
                )}
                <Text style={[
                  styles.typeChipText,
                  selectedType === type && styles.typeChipTextSelected
                ]}>
                  {type}
                </Text>
              </BlurView>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Equipment List */}
      <ScrollView
        style={styles.equipmentList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#A78BFA']} />
        }
      >
        {filteredEquipment.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            onPress={() => router.push(`/equipment/${item.id}`)}
          >
            <BlurView intensity={20} tint="light" style={styles.equipmentCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
                style={styles.equipmentCardGradient}
              >
                <View style={styles.equipmentCardContent}>

                  {/* NEW: Equipment Image */}
                  <View style={styles.imageContainer}>
                    {item.photos && item.photos.length > 0 ? (
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
                    ) : (
                      <View style={styles.noImage}>
                        <MaterialIcons name="image-not-supported" size={28} color="#A78BFA" />
                        <Text style={styles.noImageText}>No photo</Text>
                      </View>
                    )}
                  </View>

                  {/* Equipment Header */}
                  <View style={styles.equipmentHeader}>
                    <View style={styles.equipmentTitleContainer}>
                      <Text variant="titleMedium" style={styles.equipmentName}>
                        {item.name}
                      </Text>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{item.equipment_type}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Equipment Description */}
                  <Text variant="bodyMedium" style={styles.equipmentDescription} numberOfLines={2}>
                    {item.description}
                  </Text>

                  {/* Equipment Details */}
                  <View style={styles.equipmentDetails}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="location-on" size={16} color="#A78BFA" />
                      </View>
                      <Text style={styles.detailText}>{item.location}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="payments" size={16} color="#A78BFA" />
                      </View>
                      <Text style={styles.priceText}>
                        ₹{item.rental_price} {item.price_type === 'per_hour' ? '/hour' : '/day'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="event-available" size={16} color="#A78BFA" />
                      </View>
                      <Text style={styles.detailText}>
                        {new Date(item.availability_start).toLocaleDateString()} - {new Date(item.availability_end).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {/* Owner Info */}
                  {item.profiles && (
                    <View style={styles.ownerInfo}>
                      <View style={styles.ownerAvatar}>
                        <MaterialIcons name="person" size={16} color="#A78BFA" />
                      </View>
                      <Text style={styles.ownerName}>{item.profiles.full_name}</Text>
                      {item.profiles.rating > 0 && (
                        <View style={styles.ratingBadge}>
                          <MaterialIcons name="star" size={14} color="#FFA500" />
                          <Text style={styles.ratingText}>{item.profiles.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() => router.push(`/equipment/${item.id}`)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.detailsButtonText}>Details</Text>
                      <MaterialIcons name="arrow-forward" size={18} color="#A78BFA" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => router.push(`/equipment/${item.id}/book`)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#A78BFA', '#8B5CF6']}
                        style={styles.bookButton}
                      >
                        <Text style={styles.bookButtonText}>Book Now</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          </TouchableOpacity>
        ))}

        {/* Empty State */}
        {filteredEquipment.length === 0 && !loading && (
          <BlurView intensity={20} tint="light" style={styles.emptyCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.emptyCardGradient}
            >
              <View style={styles.emptyContent}>
                <View style={styles.emptyIconContainer}>
                  <MaterialIcons name="construction" size={48} color="#A78BFA" />
                </View>
                <Text variant="titleLarge" style={styles.emptyTitle}>
                  No equipment found
                </Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  {searchQuery || selectedType
                    ? 'Try adjusting your search or filters'
                    : 'No equipment available at the moment'}
                </Text>
                {(searchQuery || selectedType) && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedType('');
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#A78BFA', '#8B5CF6']}
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

      {/* Bottom Left Button - My Equipment */}
      <TouchableOpacity
        style={styles.myEquipmentContainer}
        onPress={() => router.push('/equipment/my-equipment')}
        activeOpacity={0.85}
      >
        <BlurView intensity={30} tint="light" style={styles.myEquipmentButton}>
          <LinearGradient
            colors={['rgba(167, 139, 250, 0.2)', 'rgba(139, 92, 246, 0.2)']}
            style={styles.myEquipmentGradient}
          >
            <MaterialIcons name="list" size={20} color="#A78BFA" />
            <Text style={styles.myEquipmentText}>My Equipment</Text>
          </LinearGradient>
        </BlurView>
      </TouchableOpacity>

      {/* Bottom Right Button - My Bookings */}
      <TouchableOpacity
        style={[styles.myEquipmentContainer, { right: 16, left: undefined }]}
        onPress={() => router.push('/equipment/my-bookings')}
        activeOpacity={0.85}
      >
        <BlurView intensity={30} tint="light" style={styles.myEquipmentButton}>
          <LinearGradient
            colors={['rgba(167, 139, 250, 0.2)', 'rgba(139, 92, 246, 0.2)']}
            style={styles.myEquipmentGradient}
          >
            <MaterialIcons name="event" size={20} color="#A78BFA" />
            <Text style={styles.myEquipmentText}>My Bookings</Text>
          </LinearGradient>
        </BlurView>
      </TouchableOpacity>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => router.push('/equipment/add')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#A78BFA', '#8B5CF6']}
          style={styles.fab}
        >
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.fabText}>List Equipment</Text>
        </LinearGradient>
      </TouchableOpacity>
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
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
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
    borderColor: 'rgba(167, 139, 250, 0.2)',
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
  typesContainer: {
    marginBottom: 8,
  },
  typesContent: {
    gap: 8,
    paddingRight: 24,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
  },
  typeChipSelected: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  chipIcon: {
    marginRight: 6,
  },
  typeChipText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  typeChipTextSelected: {
    color: '#A78BFA',
    fontWeight: '700',
  },
  equipmentList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  equipmentCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
    elevation: 4,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  equipmentCardGradient: {
    padding: 20,
  },
  equipmentCardContent: {
    gap: 12,
  },
  equipmentHeader: {
    marginBottom: 4,
  },
  equipmentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  equipmentName: {
    flex: 1,
    color: '#1F2937',
    fontWeight: '700',
  },
  typeBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  typeBadgeText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  equipmentDescription: {
    color: '#6B7280',
    lineHeight: 20,
  },
  equipmentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    color: '#6B7280',
    fontSize: 14,
    flex: 1,
  },
  priceText: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167, 139, 250, 0.1)',
  },
  ownerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  ownerName: {
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167, 139, 250, 0.1)',
    marginTop: 4,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
  },
  detailsButtonText: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '700',
  },
  bookButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
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
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
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
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
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
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  unauthTitle: {
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 8,
  },
  unauthText: {
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  myEquipmentContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  myEquipmentButton: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  myEquipmentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  myEquipmentText: {
    color: '#A78BFA',
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
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
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
  // NEW: image styles
  imageContainer: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    color: '#A78BFA',
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
});