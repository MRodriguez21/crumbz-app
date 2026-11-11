import type { ColorRole, TypographyRole } from '@crumbz/ui';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { textStyle, useColors } from '@/theme';

type TextProps = RNTextProps & {
  /** Typography role. Not `role`: that prop is React Native's accessibility role. */
  variant?: TypographyRole;
  tone?: ColorRole;
  /** Tabular figures so numbers line up in columns. */
  tabular?: boolean;
};

export function Text({ variant = 'body', tone = 'text', tabular, style, ...rest }: TextProps) {
  const c = useColors();
  return (
    <RNText
      style={[
        textStyle(variant),
        { color: c[tone] },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
      {...rest}
    />
  );
}
