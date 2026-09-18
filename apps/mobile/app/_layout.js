import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/lib/auth-context';
import { onNotificationTap } from '../src/lib/push';
import { CartProvider } from '../src/lib/cart-context';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NotificationRouter />
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
          <Stack.Screen name="drops" options={{ title: 'Drops' }} />
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

/**
 * Abre la pantalla de drops cuando el usuario toca una notificación,
 * ya sea con la app abierta o desde la app cerrada.
 */
function NotificationRouter() {
  const router = useRouter();

  useEffect(
    () =>
      onNotificationTap((response) => {
        if (response?.notification?.request?.content?.data?.type === 'drop') {
          router.push('/drops');
        }
      }),
    [router],
  );

  return null;
}
