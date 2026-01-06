import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';
import { CartProvider } from '@/contexts/CartContext';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <AlertProvider>
      <AuthProvider>
        <CartProvider>
          <SafeAreaProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="role-select" />
              <Stack.Screen name="login" />
              <Stack.Screen name="customer" />
              <Stack.Screen name="staff" />
            </Stack>
          </SafeAreaProvider>
        </CartProvider>
      </AuthProvider>
    </AlertProvider>
  );
}
