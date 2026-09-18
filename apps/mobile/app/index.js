import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProductCard from '../src/components/ProductCard';
import { apiFetch } from '../src/lib/api';
import { useAuth } from '../src/lib/auth-context';
import { useCart } from '../src/lib/cart-context';
import { formatNumber } from '../src/lib/format';
import { colors } from '../src/theme/colors';

const PAGE_SIZE = 10;
const GAP = 12;
const PADDING = 16;

export default function Catalog() {
  const router = useRouter();
  const { user } = useAuth();
  const { count } = useCart();
  const { width } = useWindowDimensions();
  const cardWidth = (width - PADDING * 2 - GAP) / 2;

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Evita que una respuesta lenta de una búsqueda vieja pise a la actual.
  const requestId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    apiFetch('/api/categories')
      .then((data) => setCategories(data?.items ?? []))
      .catch(() => setCategories([]));
  }, []);

  const buildQuery = useCallback(
    (targetPage) => {
      const params = new URLSearchParams({ page: String(targetPage), limit: String(PAGE_SIZE) });
      if (debounced) params.set('q', debounced);
      if (category) params.set('category', category);
      return `/api/products?${params.toString()}`;
    },
    [debounced, category],
  );

  const loadFirstPage = useCallback(async () => {
    const id = ++requestId.current;
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    setError(null);
    try {
      const data = await apiFetch(buildQuery(1));
      if (id !== requestId.current) return;
      setItems(data.items);
      setTotal(data.total);
      setPage(1);
      setStatus('ready');
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.message);
      setStatus('error');
    }
  }, [buildQuery]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || status !== 'ready' || items.length >= total) return;
    setLoadingMore(true);
    const id = requestId.current;
    try {
      const data = await apiFetch(buildQuery(page + 1));
      if (id !== requestId.current) return;
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...data.items.filter((p) => !seen.has(p.id))];
      });
      setTotal(data.total);
      setPage((p) => p + 1);
    } catch {
      // Silencioso: la lista ya cargada sigue sirviendo.
    } finally {
      setLoadingMore(false);
    }
  }, [buildQuery, items.length, loadingMore, page, status, total]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }, [loadFirstPage]);

  const header = (
    <View>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View style={styles.mark}>
            <Text style={styles.markText}>✦</Text>
          </View>
          <Text style={styles.logo}>VOKTER</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable onPress={() => router.push('/carrito')} hitSlop={8} style={styles.iconButton}>
            <Ionicons name="bag-outline" size={19} color={colors.foreground} />
            {count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => router.push('/escaner')} hitSlop={8} style={styles.iconButton}>
            <Ionicons name="qr-code-outline" size={19} color={colors.foreground} />
          </Pressable>
          <Pressable onPress={() => router.push('/cuenta')} hitSlop={8} style={styles.iconButton}>
            {user ? (
              <Text style={styles.avatarInitial}>{user.name.trim()[0]?.toUpperCase()}</Text>
            ) : (
              <Ionicons name="person-outline" size={19} color={colors.foreground} />
            )}
          </Pressable>
        </View>
      </View>

      <Text style={styles.title}>{user ? `Hola, ${user.name.split(/\s+/)[0]}` : 'Catálogo'}</Text>
      <Text style={styles.subtitle}>
        {status === 'ready'
          ? `${formatNumber(total)} producto${total === 1 ? '' : 's'} verificados`
          : 'Tecnología urbana verificada'}
      </Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={17} color={colors.subtle} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar cargador, audífonos…"
          placeholderTextColor={colors.subtle}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={10}>
            <Ionicons name="close-circle" size={17} color={colors.subtle} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        <Chip label="Todo" active={!category} onPress={() => setCategory(null)} />
        {categories.map((c) => (
          <Chip
            key={c.slug}
            label={c.name}
            active={category === c.slug}
            onPress={() => setCategory(category === c.slug ? null : c.slug)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <FlatList
        data={status === 'error' ? [] : items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
        ListHeaderComponent={header}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          status === 'loading' ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} />
          ) : status === 'error' ? (
            <View style={styles.state}>
              <Ionicons name="cloud-offline-outline" size={30} color={colors.danger} />
              <Text style={styles.stateTitle}>Sin conexión con el catálogo</Text>
              <Text style={styles.stateText}>{error}</Text>
              <Pressable onPress={loadFirstPage} style={styles.stateButton}>
                <Text style={styles.stateButtonText}>Reintentar</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/ajustes')} hitSlop={8}>
                <Text style={styles.link}>Revisar la URL de la API</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.state}>
              <Ionicons name="search-outline" size={30} color={colors.subtle} />
              <Text style={styles.stateTitle}>Nada por aquí</Text>
              <Text style={styles.stateText}>
                No hay productos para esa búsqueda. Prueba con otra palabra o quita el filtro.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
          ) : items.length > 0 && items.length >= total ? (
            <Text style={styles.endText}>Fin del catálogo</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: PADDING, paddingBottom: 40, gap: GAP },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { color: colors.accentForeground, fontSize: 15, fontWeight: '900' },
  logo: { color: colors.foreground, fontSize: 17, fontWeight: '800', letterSpacing: 1 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.accentForeground, fontSize: 10, fontWeight: '800' },
  avatarInitial: { color: colors.accent, fontSize: 15, fontWeight: '800' },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.foreground, fontSize: 30, fontWeight: '800', letterSpacing: -1, marginTop: 24 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    marginTop: 18,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, color: colors.foreground, fontSize: 15, padding: 0 },
  chipsScroll: { marginTop: 14, marginHorizontal: -PADDING },
  chipsRow: { gap: 8, paddingHorizontal: PADDING, paddingBottom: 18 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  chipLabelActive: { color: colors.accentForeground },
  state: { alignItems: 'center', gap: 10, paddingTop: 56, paddingHorizontal: 20 },
  stateTitle: { color: colors.foreground, fontSize: 17, fontWeight: '700' },
  stateText: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  stateButton: {
    marginTop: 8,
    height: 44,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateButtonText: { color: colors.accentForeground, fontSize: 14, fontWeight: '700' },
  link: { color: colors.accent, fontSize: 13, fontWeight: '600', marginTop: 6 },
  endText: {
    color: colors.subtle,
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 24,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
