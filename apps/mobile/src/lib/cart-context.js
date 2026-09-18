import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'vokter.cart';
const MAX_QTY = 20; // el backend rechaza más de 20 por línea

const CartContext = createContext(null);

/**
 * Carrito local: guarda lo mínimo para pintarlo (nombre, precio, foto) y se
 * persiste en el teléfono. El precio real y el stock los vuelve a calcular el
 * backend al crear el pedido, así que un precio viejo aquí nunca se cobra.
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setItems(parsed);
      } catch {
        // Carrito ilegible: se empieza vacío en vez de romper la app.
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, ready]);

  const add = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.productId === product.id);
      const limit = Math.min(MAX_QTY, product.stock ?? MAX_QTY);
      if (found) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: Math.min(limit, i.quantity + quantity) }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          priceCents: product.priceCents,
          coverUrl: product.coverUrl ?? product.images?.[0]?.url ?? null,
          stock: product.stock,
          quantity: Math.min(limit, quantity),
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.min(MAX_QTY, i.stock ?? MAX_QTY, quantity) }
              : i,
          ),
    );
  }, []);

  const remove = useCallback(
    (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId)),
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const subtotalCents = items.reduce((n, i) => n + i.priceCents * i.quantity, 0);
    return { items, ready, count, subtotalCents, add, setQuantity, remove, clear };
  }, [items, ready, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}

export const ORDER_STATUS = {
  pending: { label: 'Pendiente', tone: 'warning' },
  paid: { label: 'Pagado', tone: 'accent' },
  shipped: { label: 'Enviado', tone: 'accent' },
  delivered: { label: 'Entregado', tone: 'live' },
  cancelled: { label: 'Cancelado', tone: 'danger' },
  refunded: { label: 'Reembolsado', tone: 'muted' },
};
