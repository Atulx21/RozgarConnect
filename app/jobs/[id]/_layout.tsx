import { Stack } from 'expo-router';

export default function JobDetailsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* ADDED: The main details screen for this group */}
      <Stack.Screen name="index" />
      
      {/* These were already correct */}
      <Stack.Screen name="applications" />
      <Stack.Screen name="complete" />

      {/* ADDED: The nested route for the rating screen */}
      <Stack.Screen name="rate" />
    </Stack>
  );
}