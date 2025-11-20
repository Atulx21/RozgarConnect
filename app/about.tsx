import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { router } from 'expo-router';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            About Gramin KaamConnect
          </Text>
          <Text style={styles.body}>
            Gramin KaamConnect empowers rural communities by connecting workers, providers, and equipment owners through a simple, unified platform.
          </Text>
          <Button mode="contained" onPress={() => router.back()} style={styles.button}>
            Go Back
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F7F9FC' },
  card: { borderRadius: 16 },
  title: { color: '#2D3748', fontWeight: 'bold', marginBottom: 8 },
  body: { color: '#4A5568', lineHeight: 22, marginBottom: 16 },
  button: { backgroundColor: '#6DD5A5' },
});