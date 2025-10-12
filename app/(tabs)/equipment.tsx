import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, Searchbar, FAB } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useEquipment } from '@/hooks/useEquipment';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

const EQUIPMENT_TYPES = ['Tractor', 'Water Pump', 'Thresher', 'Harvester', 'Plough', 'Other'];

export default function EquipmentScreen() {
  const { user, profile } = useAuth();
  const { equipment, loading, error, refreshEquipment } = useEquipment();
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    filterEquipment();
  }, [equipment, searchQuery, selectedType]);

  const filterEquipment = () => {
    let filtered = equipment;

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
        <View style={styles.unauthState}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="construction" size={48} color="#A78BFA" />
          </View>
          <Text variant="titleLarge" style={styles.unauthTitle}>
            Login Required
          </Text>
          <Text variant="bodyMedium" style={styles.unauthText}>
            Please log in to rent equipment
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
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Rent Equipment
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Find tools and machinery for your needs
        </Text>

        <Searchbar
          placeholder="Search equipment, location..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#A78BFA"
          inputStyle={styles.searchInput}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typesContainer}
          contentContainerStyle={styles.typesContent}
        >
          <Chip
            selected={selectedType === ''}
            onPress={() => setSelectedType('')}
            style={[
              styles.typeChip,
              selectedType === '' && styles.typeChipSelected,
            ]}
            textStyle={selectedType === '' && styles.typeChipTextSelected}
            icon={selectedType === '' ? 'check' : undefined}
          >
            All
          </Chip>
          {EQUIPMENT_TYPES.map(type => (
            <Chip
              key={type}
              selected={selectedType === type}
              onPress={() => setSelectedType(type)}
              style={[
                styles.typeChip,
                selectedType === type && styles.typeChipSelected,
              ]}
              textStyle={selectedType === type && styles.typeChipTextSelected}
              icon={selectedType === type ? 'check' : undefined}
            >
              {type}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.equipmentList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#A78BFA']} />
        }
      >
        {filteredEquipment.map((item) => (
          <Card key={item.id} style={styles.equipmentCard} mode="elevated">
            <Card.Content>
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

              <Text variant="bodyMedium" style={styles.equipmentDescription} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.equipmentDetails}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="location-on" size={18} color="#718096" />
                  <Text style={styles.detailText}>{item.location}</Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="payments" size={18} color="#A78BFA" />
                  <Text style={styles.priceText}>
                    ₹{item.rental_price} {item.price_type === 'per_hour' ? '/hour' : '/day'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="event-available" size={18} color="#718096" />
                  <Text style={styles.detailText}>
                    {new Date(item.availability_start).toLocaleDateString()} - {new Date(item.availability_end).toLocaleDateString()}
                  </Text>
                </View>

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
              </View>
            </Card.Content>
            <Card.Actions style={styles.cardActions}>
              <Button
                mode="text"
                onPress={() => router.push(`/equipment/${item.id}`)}
                textColor="#A78BFA"
              >
                Details
              </Button>
              <Button
                mode="contained"
                onPress={() => router.push(`/equipment/${item.id}/book`)}
                buttonColor="#A78BFA"
                style={styles.bookButton}
              >
                Book Now
              </Button>
            </Card.Actions>
          </Card>
        ))}

        {filteredEquipment.length === 0 && !loading && (
          <Card style={styles.emptyCard} mode="elevated">
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="construction" size={64} color="#CBD5E0" />
              <Text variant="titleLarge" style={styles.emptyTitle}>
                No equipment found
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                {searchQuery || selectedType
                  ? 'Try adjusting your search or filters'
                  : 'No equipment available at the moment'}
              </Text>
              {(searchQuery || selectedType) && (
                <Button
                  mode="outlined"
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedType('');
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

      <View style={styles.bottomButtons}>
        <Button
          mode="outlined"
          onPress={() => router.push('/equipment/my-equipment')}
          style={styles.myEquipmentButton}
          icon={({ size, color }) => (
            <MaterialIcons name="list" size={size} color={color} />
          )}
        >
          My Equipment
        </Button>
      </View>

      <FAB
        icon={({ size, color }) => (
          <MaterialIcons name="add" size={size} color={color} />
        )}
        style={styles.fab}
        onPress={() => router.push('/equipment/add')}
        label="List"
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
  typesContainer: {
    marginBottom: 8,
  },
  typesContent: {
    gap: 8,
  },
  typeChip: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
  },
  typeChipSelected: {
    backgroundColor: '#F3F0FF',
  },
  typeChipTextSelected: {
    color: '#A78BFA',
    fontWeight: '600',
  },
  equipmentList: {
    flex: 1,
    padding: 24,
  },
  equipmentCard: {
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  equipmentHeader: {
    marginBottom: 12,
  },
  equipmentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentName: {
    flex: 1,
    color: '#2D3748',
    fontWeight: 'bold',
  },
  typeBadge: {
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  equipmentDescription: {
    color: '#718096',
    marginBottom: 16,
    lineHeight: 20,
  },
  equipmentDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#718096',
    fontSize: 14,
  },
  priceText: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '600',
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  ownerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerName: {
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
    justifyContent: 'space-between',
  },
  bookButton: {
    borderRadius: 12,
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
    borderColor: '#A78BFA',
    marginTop: 8,
  },
  unauthState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  unauthTitle: {
    color: '#2D3748',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  unauthText: {
    color: '#718096',
    marginBottom: 24,
    textAlign: 'center',
  },
  loginButton: {
    borderRadius: 20,
    backgroundColor: '#6DD5A5',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  myEquipmentButton: {
    borderRadius: 16,
    borderColor: '#A78BFA',
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
    backgroundColor: '#A78BFA',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
});
