import { colors, fontFamily, typography, type ColorScheme, type TypographyRole } from '@crumbz/ui';
import { useColorScheme, type TextStyle } from 'react-native';

export { photoAspectRatio, radius, space, touchTarget } from '@crumbz/ui';

/** Semantic colors for the current system appearance. */
export function useColors(): ColorScheme {
  return useColorScheme() === 'dark' ? colors.dark : colors.light;
}

/** Native text style for a typography role (one font family per weight on native). */
export function textStyle(role: TypographyRole): TextStyle {
  const t = typography[role];
  return {
    fontFamily: fontFamily.native[t.weight],
    fontSize: t.size,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
  };
}
