import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { resolveImage } from '../lib/api';
import { formatCOP } from '../lib/format';
import { colors } from '../theme/colors';

function ProductCard({ product, width }) {
  const router = useRouter();
  const image = resolveImage(product.coverUrl);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;
  const verified = product.authenticityStatus ? product.authenticityStatus === 'active' : true;

  return (
    <Pressable
      onPress={() => router.push(`/product/${product.slug}`)}
      style={({ pressed }) => [styles.card, { width }, pressed && { opacity: 0.75 }]}
    >
      <View style={styles.tile}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={[styles.image, outOfStock && { opacity: 0.55 }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>VOKTER</Text>
          </View>
        )}

        <View style={styles.tileTop}>
          {verified ? (
            <View style={styles.chip}>
              <Ionicons name="shield-checkmark" size={11} color={colors.live} />
              <Text style={styles.chipText}>Verificado</Text>
            </View>
          ) : (
            <View />
          )}
          {outOfStock ? (
            <View style={styles.chip}>
              <Text style={[styles.chipText, { color: colors.danger }]}>Agotado</Text>
            </View>
          ) : lowStock ? (
            <View style={styles.chip}>
              <Text style={[styles.chipText, { color: colors.warning }]}>Últimas {product.stock}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow} numberOfLines={1}>
          {product.brand || product.category?.name || 'Vokter'}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatCOP(product.priceCents)}</Text>
          {product.reviewCount > 0 && (
            <View style={styles.rating}>
              <Ionicons name="star" size={11} color={colors.accent} />
              <Text style={styles.ratingText}>{Number(product.rating).toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 8,
  },
  tile: { borderRadius: 12, overflow: 'hidden', backgroundColor: colors.tile, aspectRatio: 1 },
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: 'rgba(0,0,0,0.14)', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  tileTop: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  body: { paddingHorizontal: 4, paddingTop: 10, paddingBottom: 4, gap: 4 },
  eyebrow: {
    color: colors.subtle,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'monospace',
  },
  name: { color: colors.foreground, fontSize: 14, lineHeight: 19, fontWeight: '500', minHeight: 38 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  price: { color: colors.foreground, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { color: colors.muted, fontSize: 11, fontFamily: 'monospace' },
});

export default memo(ProductCard);
