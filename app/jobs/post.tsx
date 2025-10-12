import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Menu, Divider } from 'react-native-paper';
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
  const [menuVisible, setMenuVisible] = useState(false);
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
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (!validatePayAmount(payAmount)) {
      Alert.alert('Error', 'Please enter a valid pay amount.');
      return;
    }

    if (!validateWorkersNeeded(workersNeeded)) {
      Alert.alert('Error', 'Please enter a valid number of workers.');
      return;
    }
    
    if (deadlineDate < new Date()) {
      Alert.alert('Error', 'The application deadline cannot be in the past.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to post a job');
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

      Alert.alert('Success', 'Job posted successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error posting job:', error);
      Alert.alert('Error', 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Post a New Job
        </Text>
      </View>

      <Card style={styles.formCard}>
        <Card.Content>
          <TextInput
            mode="outlined"
            label="Job Title *"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholder="e.g., Farm Helper Needed"
          />

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TextInput
                mode="outlined"
                label="Category *"
                value={category}
                style={styles.input}
                right={<TextInput.Icon icon="chevron-down" onPress={() => setMenuVisible(true)} />}
                editable={false}
              />
            }
          >
            {JOB_CATEGORIES.map(cat => (
              <Menu.Item
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  setMenuVisible(false);
                }}
                title={cat}
              />
            ))}
          </Menu>

          <TextInput
            mode="outlined"
            label="Description *"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            multiline
            numberOfLines={4}
            placeholder="Describe the work to be done..."
          />

          <TextInput
            mode="outlined"
            label="Number of Workers Needed *"
            value={workersNeeded}
            onChangeText={setWorkersNeeded}
            style={styles.input}
            keyboardType="number-pad"
          />

          <View style={styles.paySection}>
            <TextInput
              mode="outlined"
              label="Pay Amount (₹) *"
              value={payAmount}
              onChangeText={setPayAmount}
              style={[styles.input, styles.payInput]}
              keyboardType="number-pad"
              placeholder="500"
            />
            
            <View style={styles.payTypeButtons}>
              <Button
                mode={payType === 'per_day' ? 'contained' : 'outlined'}
                onPress={() => setPayType('per_day')}
                style={styles.payTypeButton}
              >
                Per Day
              </Button>
              <Button
                mode={payType === 'total' ? 'contained' : 'outlined'}
                onPress={() => setPayType('total')}
                style={styles.payTypeButton}
              >
                Total
              </Button>
            </View>
          </View>

          <TextInput
            mode="outlined"
            label="Location *"
            value={location}
            onChangeText={setLocation}
            style={styles.input}
            placeholder="Village, District"
          />

          <Text style={styles.label}>Application Deadline *</Text>
          <Button
            icon="calendar"
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
            contentStyle={styles.dateButtonContent}
            labelStyle={styles.dateButtonLabel}
          >
            {deadlineDate.toLocaleDateString('en-IN')}
          </Button>

          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={deadlineDate}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={onChangeDate}
              minimumDate={new Date()}
            />
          )}

          <Divider style={styles.divider} />

          <Button 
            mode="contained" 
            onPress={postJob}
            loading={loading}
            disabled={loading}
            style={styles.postButton}
            icon="plus"
          >
            Post Job
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: { 
    padding: 20, 
    paddingTop: 60, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0' 
  },
  title: { 
    color: '#2e7d32', 
    fontWeight: 'bold' 
  },
  formCard: { 
    margin: 15, 
    elevation: 2 
  },
  input: { 
    marginBottom: 15 
  },
  paySection: { 
    marginBottom: 15 
  },
  payInput: { 
    marginBottom: 10 
  },
  payTypeButtons: { 
    flexDirection: 'row', 
    gap: 10 
  },
  payTypeButton: { 
    flex: 1 
  },
  divider: { 
    marginVertical: 20 
  },
  postButton: { 
    backgroundColor: '#4caf50', 
    paddingVertical: 5 
  },
  label: {
    fontSize: 12,
    color: '#666',
    paddingBottom: 4,
    marginLeft: 12,
  },
  dateButton: {
    height: 56,
    justifyContent: 'center',
    borderColor: '#888',
  },
  dateButtonContent: {
    justifyContent: 'flex-start',
    paddingLeft: 4,
  },
  dateButtonLabel: {
    color: '#333',
    fontSize: 16,
  }
});