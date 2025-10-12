import { Stack } from 'expo-router';

export default function JobDetailsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="applications" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}