import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { space, touchTarget } from '@/theme';

import { photoUrl, thumbPath } from '../photos';
import { useMyPosts } from '../queries';
import { VisitRow, visitMeta } from './visit-row';

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
        {posts.map((post, i) => {
          const cover = [...post.photos].sort((a, b) => a.position - b.position)[0];
          return (
            <VisitRow
              key={post.id}
              first={i === 0}
              title={post.place?.name ?? 'Lugar no disponible'}
              meta={visitMeta(post.visited_on, post.mode, post.spend_per_person_usd)}
              rating={post.rating}
              thumbUri={cover ? photoUrl(thumbPath(cover.storage_path)) : null}
              onPress={post.place ? () => router.push(`/place/${post.place!.slug}`) : undefined}
            />
          );
        })}
      </View>
      <View style={styles.row}>
        <Button label="Publicar visita" icon={Plus} variant="outline" onPress={startVisit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  header: { gap: space.xxs },
  empty: { gap: space.xs },
  row: { flexDirection: 'row', marginTop: space.sm },
  retry: { minHeight: touchTarget, justifyContent: 'center' },
});
