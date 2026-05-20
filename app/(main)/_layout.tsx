import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="camera" />
      <Stack.Screen name="preview" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="chats" />
      <Stack.Screen name="chat/[id]" />
    </Stack>
  );
}
