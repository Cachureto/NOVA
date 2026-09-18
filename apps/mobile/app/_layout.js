import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/lib/auth-context';
import { CartProvider } from '../src/lib/cart-context';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.foreground,
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="product/[slug]" options={{ title: '' }} />
          <Stack.Screen name="escaner" options={{ title: 'Verificar autenticidad' }} />
          <Stack.Screen name="carrito" options={{ title: 'Carrito' }} />
          <Stack.Screen name="pedidos" options={{ title: 'Mis pedidos' }} />
          <Stack.Screen name="cuenta" options={{ title: 'Cuenta' }} />
          <Stack.Screen name="login" options={{ title: '' }} />
          <Stack.Screen name="registro" options={{ title: '' }} />
          <Stack.Screen name="ajustes" options={{ title: 'Ajustes' }} />
        </Stack>
      </SafeAreaProvider>
      </CartProvider>
    </AuthProvider>
  );
}
