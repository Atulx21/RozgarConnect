import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface StatCardProps {
  icon: string;
  value: number | string;
  label: string;
  color?: string;
}

export default function StatCard({ icon, value, label, color = '#4caf50' }: StatCardProps) {
  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <MaterialIcons name={icon as any} size={32} color={color} />
        <Text variant="headlineMedium" style={styles.value}>
          {value}
        </Text>
        <Text variant="bodyMedium" style={styles.label}>
          {label}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    elevation: 2,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  value: {
    color: '#333',
    fontWeight: 'bold',
    marginVertical: 10,
  },
  label: {
    color: '#666',
    textAlign: 'center',
  },
});