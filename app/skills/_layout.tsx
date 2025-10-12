import { Stack } from 'expo-router';

export default function SkillsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="manage" />
      <Stack.Screen name="browse" />
    </Stack>
  );
}