import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, DefaultTheme } from 'react-native-paper';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6DD5A5',
    primaryContainer: '#E8F7EF',
    secondary: '#A78BFA',
    secondaryContainer: '#F3F0FF',
    tertiary: '#60C5F4',
    surface: '#FFFFFF',
    surfaceVariant: '#F9F9F9',
    background: '#F9F9F9',
    onPrimary: '#FFFFFF',
    onSurface: '#2D3748',
    onSurfaceVariant: '#718096',
    outline: '#E2E8F0',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
  },
  roundness: 20,
};

export default function RootLayout() {
  useFrameworkReady();

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="jobs" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="equipment" />
        <Stack.Screen name="skills" />
        <Stack.Screen name="search" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </PaperProvider>
  );
}