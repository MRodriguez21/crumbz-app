import { AtSign, MessageCircle, Plus } from 'lucide-react-native';
import { Linking, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { space, useColors } from '@/theme';

type Props = { whatsapp?: string | null; instagram?: string | null; onPublish: () => void };

/**
 * Fixed bottom actions, two equal pills. WhatsApp is the only filled (proof-colored) action;
 * without it, Instagram takes the contact slot in ink, so delivery-only places keep their
 * order channel at hand.
 */
export function PlaceActionBar({ whatsapp, instagram, onPublish }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: c.background,
          borderTopColor: c.line,
          paddingBottom: Math.max(insets.bottom, space.md),
        },
      ]}
    >
      {whatsapp ? (
        <Button
          label="WhatsApp"
          icon={MessageCircle}
          variant="proof"
          // TODO(phase-4): track whatsapp_clicked with place_id/city_id/area_id.
          onPress={() => Linking.openURL(`https://wa.me/${whatsapp.replace(/\D/g, '')}`)}
        />
      ) : instagram ? (
        <Button
          label="Instagram"
          icon={AtSign}
          variant="outline"
          // TODO(phase-4): track instagram_clicked.
          onPress={() => Linking.openURL(`https://instagram.com/${instagram}`)}
        />
      ) : null}
      <Button label="Publicar visita" icon={Plus} variant="outline" onPress={onPublish} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
  },
});
