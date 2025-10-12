import { Stack } from 'expo-router';

export default function EquipmentDetailsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="book" />
      <Stack.Screen name="bookings" />
    </Stack>
  );
}