import { Stack } from 'expo-router';

export default function EquipmentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="add" />
      <Stack.Screen name="my-equipment" />
    </Stack>
  );
}