/**
 * crumbz design tokens — "dicho y probado".
 *
 * A fine warm-neutral (stone) scale plus ONE accent, reserved for proof: counts of real
 * people, confirmations and the WhatsApp action. If something isn't evidence or that
 * action, it doesn't get the accent.
 *
 * Primitives -> semantic roles. Apps consume the semantic roles only.
 */

const stone = {
  0: '#FFFFFF',
  50: '#FAFAF9',
  100: '#F5F5F4',
  150: '#F0EFED',
  200: '#E7E5E4',
  300: '#D6D3D1',
  400: '#A8A29E',
  500: '#78716C',
  600: '#6A625D',
  700: '#44403C',
  800: '#292524',
  850: '#1F1C1A',
  900: '#1C1917',
  950: '#141210',
} as const;

const proof = {
  300: '#7FD8A8',
  400: '#4CC38A',
  600: '#1F7A4D',
  700: '#17603C',
  950: '#0B1F14',
} as const;

const status = {
  amberLight: '#A15C07',
  amberDark: '#F0B44C',
  redLight: '#B42318',
  redDark: '#F97066',
} as const;

export const primitives = { stone, proof, status } as const;

export type ColorRole =
  | 'background'
  | 'surface'
  | 'surfaceRaised'
  | 'line'
  /** Overlay for pressed/ripple feedback on tappable rows and icons. */
  | 'pressed'
  /** Dimmed backdrop behind dialogs and sheets. */
  | 'scrim'
  | 'text'
  | 'textMuted'
  | 'textOnInverse'
  | 'inverse'
  | 'proof'
  | 'onProof'
  | 'proofSubtle'
  | 'warning'
  | 'danger'
  | 'photoPlaceholder';

export type ColorScheme = Record<ColorRole, string>;

/** Contrast-checked: text/textMuted ≥ 4.5:1 on background and surface in both schemes. */
export const colors: Record<'light' | 'dark', ColorScheme> = {
  light: {
    background: stone[50],
    surface: stone[150],
    surfaceRaised: stone[0],
    line: stone[200],
    pressed: 'rgba(28, 25, 23, 0.08)',
    scrim: 'rgba(28, 25, 23, 0.48)',
    text: stone[900],
    textMuted: stone[600],
    textOnInverse: stone[50],
    inverse: stone[900],
    proof: proof[600],
    onProof: stone[0],
    proofSubtle: '#E3F1E9',
    warning: status.amberLight,
    danger: status.redLight,
    photoPlaceholder: stone[300],
  },
  dark: {
    background: stone[950],
    surface: stone[850],
    surfaceRaised: stone[800],
    line: '#2E2A27',
    pressed: 'rgba(245, 245, 244, 0.10)',
    scrim: 'rgba(0, 0, 0, 0.64)',
    text: stone[100],
    textMuted: stone[400],
    textOnInverse: stone[900],
    inverse: stone[100],
    proof: proof[400],
    onProof: proof[950],
    proofSubtle: '#15301F',
    warning: status.amberDark,
    danger: status.redDark,
    photoPlaceholder: stone[700],
  },
};

/** 4-pt spacing scale. */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Minimum touch target (Android 48 dp; covers iOS 44 pt). */
export const touchTarget = 48;

/** User photos always sit on fixed 4:5 plates so visits compare side by side. */
export const photoAspectRatio = 4 / 5;

export const fontFamily = {
  /** CSS family name (web). */
  web: "'Manrope', system-ui, sans-serif",
  /** Expo font keys (native needs one family per weight). */
  native: {
    regular: 'Manrope_500Medium',
    bold: 'Manrope_800ExtraBold',
  },
} as const;

export type FontWeightName = keyof typeof fontFamily.native;

export interface TextStyleToken {
  size: number;
  lineHeight: number;
  weight: FontWeightName;
  letterSpacing: number;
}

/**
 * Type roles (Material-style names). Sizes are sp/px; native text scales with the
 * system font size. Two weights only: 500 and 800.
 */
export const typography = {
  display: { size: 52, lineHeight: 52, weight: 'bold', letterSpacing: -2 },
  headline: { size: 32, lineHeight: 36, weight: 'bold', letterSpacing: -1 },
  title: { size: 20, lineHeight: 26, weight: 'bold', letterSpacing: -0.3 },
  body: { size: 16, lineHeight: 22, weight: 'regular', letterSpacing: 0 },
  bodyStrong: { size: 16, lineHeight: 22, weight: 'bold', letterSpacing: 0 },
  bodySmall: { size: 14, lineHeight: 20, weight: 'regular', letterSpacing: 0 },
  label: { size: 12, lineHeight: 16, weight: 'regular', letterSpacing: 0.1 },
  labelStrong: { size: 12, lineHeight: 16, weight: 'bold', letterSpacing: 0.1 },
} as const satisfies Record<string, TextStyleToken>;

export type TypographyRole = keyof typeof typography;

export const fontWeightValue: Record<FontWeightName, number> = {
  regular: 500,
  bold: 800,
};
