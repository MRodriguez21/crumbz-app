import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { radius, space, touchTarget, useColors } from '@/theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Destructive actions render the confirm label in the danger color. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * In-app confirmation dialog. Replaces the native Alert so the moment uses
 * crumbz ink instead of the platform accent (one accent: proof).
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const c = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={[styles.backdrop, { backgroundColor: c.scrim }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        />
        <View
          accessibilityViewIsModal
          style={[styles.dialog, { backgroundColor: c.surfaceRaised }]}
        >
          <View style={styles.copy}>
            <Text variant="title" accessibilityRole="header">
              {title}
            </Text>
            {message ? (
              <Text variant="body" tone="textMuted">
                {message}
              </Text>
            ) : null}
          </View>
          <View style={styles.actions}>
            <DialogAction label={cancelLabel} onPress={onCancel} />
            <DialogAction
              label={confirmLabel}
              onPress={onConfirm}
              strong
              tone={destructive ? 'danger' : 'text'}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DialogAction({
  label,
  onPress,
  strong,
  tone = 'text',
}: {
  label: string;
  onPress: () => void;
  strong?: boolean;
  tone?: 'text' | 'danger';
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && { backgroundColor: c.pressed }]}
    >
      <Text variant={strong ? 'bodyStrong' : 'body'} tone={tone}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: space.xl },
  dialog: { borderRadius: radius.lg, paddingTop: space.xl, paddingBottom: space.sm },
  copy: { paddingHorizontal: space.xl, gap: space.sm },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: space.xs,
    paddingHorizontal: space.sm,
    marginTop: space.lg,
  },
  action: {
    minHeight: touchTarget,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
  },
});
