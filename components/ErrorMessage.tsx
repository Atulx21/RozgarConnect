import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

export default function ErrorMessage({ 
  title = 'Something went wrong',
  message, 
  onRetry,
  retryText = 'Try Again'
}: ErrorMessageProps) {
  return (
    <View style={styles.container}>
      <Card style={styles.errorCard}>
        <Card.Content style={styles.content}>
          <MaterialIcons name="error-outline" size={48} color="#f44336" />
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
          <Text variant="bodyMedium" style={styles.message}>
            {message}
          </Text>
          {onRetry && (
            <Button 
              mode="contained" 
              onPress={onRetry}
              style={styles.retryButton}
              icon="refresh"
            >
              {retryText}
            </Button>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    elevation: 2,
    maxWidth: 400,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    color: '#f44336',
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#4caf50',
  },
});