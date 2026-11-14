import { SERVICE_MODE_LABELS, formatUsd, formatVisitDay } from '@crumbz/shared';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { photoAspectRatio, radius, space, touchTarget, useColors } from '@/theme';

import { photoUrl, thumbPath } from '../photos';
import { useMyPosts, type MyPost } from '../queries';

const startVisit = () => router.push({ pathname: '/add-place', params: { next: 'visit' } });

/** The user's published visits as a ledger: place and facts on the left, score on the right. */
export function MyVisits() {
  const { data: posts, isPending, isError, refetch } = useMyPosts();

  if (isPending) return null;

  if (isError) {
    return (
      <Pressable accessibilityRole="button" onPress={() => refetch()} style={styles.retry}>
        <Text variant="label" tone="danger">
          No pudimos cargar tus visitas. Toca para reintentar.
        </Text>
      </Pressable>
    );
  }

  if (!posts?.length) {
    return (
      <View style={styles.empty}>
        <Text variant="title">Todavía no has publicado visitas</Text>
        <Text variant="bodySmall" tone="textMuted">
          Tu primera visita ayuda a que otros sepan dónde comer, cuánto gastar y cómo pagar.
        </Text>
        <View style={styles.row}>
          <Button label="Publicar visita" icon={Plus} variant="inverse" onPress={startVisit} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header">
          Tus visitas
        </Text>
      </View>
      <View>
        {posts.map((post, i) => (
          <VisitRow key={post.id} post={post} first={i === 0} />
        ))}
      </View>
      <View style={styles.row}>
        <Button label="Publicar visita" icon={Plus} variant="outline" onPress={startVisit} />
      </View>
    </View>
  );
}

function VisitRow({ post, first }: { post: MyPost; first: boolean }) {
  const c = useColors();
  const cover = [...post.photos].sort((a, b) => a.position - b.position)[0];
  const meta = [
    formatVisitDay(post.visited_on),
    SERVICE_MODE_LABELS[post.mode],
    post.spend_per_person_usd != null
      ? `${formatUsd(Number(post.spend_per_person_usd))} p/p`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${post.place?.name ?? 'Lugar'}, puntaje ${post.rating} de 10, ${meta}`}
      onPress={() => post.place && router.push(`/place/${post.place.slug}`)}
      android_ripple={{ color: c.pressed }}
      style={({ pressed }) => [
        styles.visit,
        !first && { borderTopWidth: 1, borderTopColor: c.line },
        pressed && { backgroundColor: c.pressed },
      ]}
    >
      {cover ? (
        <Image
          source={{ uri: photoUrl(thumbPath(cover.storage_path)) }}
          style={[styles.thumb, { backgroundColor: c.photoPlaceholder }]}
          contentFit="cover"
          accessible={false}
        />
      ) : null}
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {post.place?.name ?? 'Lugar no disponible'}
        </Text>
        <Text variant="label" tone="textMuted" tabular numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <Text variant="title" tabular>
        {post.rating}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  header: { gap: space.xxs },
  empty: { gap: space.xs },
  row: { flexDirection: 'row', marginTop: space.sm },
  retry: { minHeight: touchTarget, justifyContent: 'center' },
  visit: {
    minHeight: touchTarget + space.md,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  thumb: { width: 40, aspectRatio: photoAspectRatio, borderRadius: radius.sm },
  text: { flex: 1, gap: space.xxs },
});
