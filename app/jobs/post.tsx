import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, Portal, Modal } from 'react-native-paper';
import { router } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { validatePayAmount, validateWorkersNeeded, sanitizeInput } from '@/utils/validation';
import { JOB_CATEGORIES } from '@/utils/constants';

export default function PostJobScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [workersNeeded, setWorkersNeeded] = useState('1');
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState<'per_day' | 'total'>('per_day');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setDeadlineDate(selectedDate);
    }
  };

  const postJob = async () => {
    if (!title.trim() || !category || !description.trim() || !payAmount || !location.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields to continue.');
      return;
    }

    if (!validatePayAmount(payAmount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid pay amount.');
      return;
    }

    if (!validateWorkersNeeded(workersNeeded)) {
      Alert.alert('Invalid Number', 'Please enter a valid number of workers.');
      return;
    }
    
    if (deadlineDate < new Date()) {
      Alert.alert('Invalid Date', 'The application deadline cannot be in the past.');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Required', 'You must be logged in to post a job');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('jobs').insert({
        provider_id: user.id,
        title: sanitizeInput(title),
        category,
        description: sanitizeInput(description),
        workers_needed: parseInt(workersNeeded),
        pay_amount: parseFloat(payAmount),
        pay_type: payType,
        location: sanitizeInput(location),
        status: 'open',
        application_deadline: deadlineDate.toISOString(),
      });

      if (error) throw error;

      Alert.alert('Success', 'Your job has been posted successfully!', [
        { text: 'Done', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error posting job:', error);
      Alert.alert('Error', 'Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.heroTitle}>Create Job Posting</Text>
          <Text style={styles.heroSubtitle}>Find the perfect workers for your needs</Text>
        </View>
        <View style={styles.headerDecoration} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '40%' }]} />
          </View>
          <Text style={styles.progressText}>Step 1 of 2 - Basic Details</Text>
        </View>

        {/* Main Form Card */}
        <Card style={styles.mainCard} elevation={0}>
          <Card.Content style={styles.cardContent}>
            
            {/* Job Title Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Job Information</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Job Title</Text>
                <TextInput
                  mode="outlined"
                  value={title}
                  onChangeText={setTitle}
                  style={styles.modernInput}
                  placeholder="e.g., Farm Helper Needed"
                  outlineColor="#e0e0e0"
                  activeOutlineColor="#4caf50"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Category Selector */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Category</Text>
                <TouchableOpacity 
                  onPress={() => setCategoryModalVisible(true)}
                  style={styles.categorySelector}
                >
                  <Text style={category ? styles.categoryText : styles.categoryPlaceholder}>
                    {category || 'Select a category'}
                  </Text>
                  <Text style={styles.categoryIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Description */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Job Description</Text>
                <TextInput
                  mode="outlined"
                  value={description}
                  onChangeText={setDescription}
                  style={[styles.modernInput, styles.textArea]}
                  multiline
                  numberOfLines={5}
                  placeholder="Describe the work, requirements, and any important details..."
                  outlineColor="#e0e0e0"
                  activeOutlineColor="#4caf50"
                  placeholderTextColor="#999"
                />
                <Text style={styles.charCount}>{description.length} characters</Text>
              </View>
            </View>

            {/* Compensation Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compensation & Team Size</Text>
              
              <View style={styles.twoColumnRow}>
                <View style={[styles.inputWrapper, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Pay Amount (₹)</Text>
                  <TextInput
                    mode="outlined"
                    value={payAmount}
                    onChangeText={setPayAmount}
                    style={styles.modernInput}
                    keyboardType="number-pad"
                    placeholder="500"
                    outlineColor="#e0e0e0"
                    activeOutlineColor="#4caf50"
                    left={<TextInput.Icon icon="currency-inr" size={20} />}
                  />
                </View>

                <View style={[styles.inputWrapper, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Workers Needed</Text>
                  <TextInput
                    mode="outlined"
                    value={workersNeeded}
                    onChangeText={setWorkersNeeded}
                    style={styles.modernInput}
                    keyboardType="number-pad"
                    outlineColor="#e0e0e0"
                    activeOutlineColor="#4caf50"
                    left={<TextInput.Icon icon="account-group" size={20} />}
                  />
                </View>
              </View>

              {/* Pay Type Toggle */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Payment Type</Text>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      payType === 'per_day' && styles.toggleButtonActive
                    ]}
                    onPress={() => setPayType('per_day')}
                  >
                    <Text style={[
                      styles.toggleText,
                      payType === 'per_day' && styles.toggleTextActive
                    ]}>
                      Per Day
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      payType === 'total' && styles.toggleButtonActive
                    ]}
                    onPress={() => setPayType('total')}
                  >
                    <Text style={[
                      styles.toggleText,
                      payType === 'total' && styles.toggleTextActive
                    ]}>
                      Total Amount
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Location & Deadline Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location & Timeline</Text>
              
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Job Location</Text>
                <TextInput
                  mode="outlined"
                  value={location}
                  onChangeText={setLocation}
                  style={styles.modernInput}
                  placeholder="Village, District"
                  outlineColor="#e0e0e0"
                  activeOutlineColor="#4caf50"
                  left={<TextInput.Icon icon="map-marker" size={20} />}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Application Deadline</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateSelector}
                >
                  <View style={styles.dateContent}>
                    <Text style={styles.dateIcon}>📅</Text>
                    <Text style={styles.dateText}>
                      {deadlineDate.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={deadlineDate}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  onChange={onChangeDate}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>📋 Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Workers:</Text>
                <Text style={styles.summaryValue}>{workersNeeded || '0'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment:</Text>
                <Text style={styles.summaryValue}>
                  ₹{payAmount || '0'} {payType === 'per_day' ? 'per day' : 'total'}
                </Text>
              </View>
              {location && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Location:</Text>
                  <Text style={styles.summaryValue}>{location}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                onPress={() => router.back()}
                style={styles.secondaryButton}
                labelStyle={styles.secondaryButtonLabel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={postJob}
                loading={loading}
                disabled={loading}
                style={styles.primaryButton}
                labelStyle={styles.primaryButtonLabel}
                icon="check-circle"
              >
                Publish Job
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Category Selection Modal */}
      <Portal>
        <Modal
          visible={categoryModalVisible}
          onDismiss={() => setCategoryModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Select Category</Text>
          <ScrollView style={styles.categoryList}>
            {JOB_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryItem,
                  category === cat && styles.categoryItemSelected
                ]}
                onPress={() => {
                  setCategory(cat);
                  setCategoryModalVisible(false);
                }}
              >
                <Text style={[
                  styles.categoryItemText,
                  category === cat && styles.categoryItemTextSelected
                ]}>
                  {cat}
                </Text>
                {category === cat && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  heroHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: '#4caf50',
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '400',
  },
  headerDecoration: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  mainCard: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  cardContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  modernInput: {
    backgroundColor: 'white',
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  categoryPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  categoryIcon: {
    fontSize: 12,
    color: '#666',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#4caf50',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: 'white',
  },
  dateSelector: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateIcon: {
    fontSize: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#f0f7f4',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderColor: '#d0d0d0',
    borderWidth: 1.5,
  },
  secondaryButtonLabel: {
    color: '#666',
    fontWeight: '600',
  },
  primaryButton: {
    flex: 2,
    backgroundColor: '#4caf50',
  },
  primaryButtonLabel: {
    fontWeight: '700',
    fontSize: 15,
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    maxHeight: '70%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  categoryItemSelected: {
    backgroundColor: '#e8f5e9',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  categoryItemTextSelected: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 20,
    color: '#4caf50',
    fontWeight: 'bold',
  },
});