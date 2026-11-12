import type { ExpoConfig } from 'expo/config';

// Read the JSON directly: the Expo config loader can't import TypeScript from workspace packages.
import identity from '../../packages/shared/src/app-identity.json';

const APP_ID = identity.id;

// Reversed iOS OAuth client ID (com.googleusercontent.apps.…). Set when Google Cloud is configured.
const GOOGLE_IOS_URL_SCHEME = process.env.GOOGLE_IOS_URL_SCHEME;

const LOCATION_PERMISSION =
  'crumbz usa tu ubicación para guardar dónde queda el lugar que estás agregando y mostrarte lugares cerca.';

const config: ExpoConfig = {
  name: identity.name,
  slug: identity.name,
  // Expo/EAS project (expo.dev). Public identifiers, not secrets.
  owner: 'mrodriguez21s-team',
  extra: {
    eas: { projectId: '602313ff-4694-48a3-91fe-c2827e06c1e8' },
  },
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: identity.scheme,
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: APP_ID,
    supportsTablet: false,
    // TODO(apple): requires the Apple Developer account (capability on the App ID).
    usesAppleSignIn: true,
  },
  android: {
    package: APP_ID,
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFFFFF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    'expo-apple-authentication',
    [
      'expo-image-picker',
      {
        photosPermission: 'crumbz usa tus fotos para tu foto de perfil y tus visitas.',
        cameraPermission: 'crumbz usa la cámara para fotografiar lo que comes.',
      },
    ],
    [
      'expo-location',
      {
        // Foreground only: no background location in the MVP.
        locationWhenInUsePermission: LOCATION_PERMISSION,
        // iOS adds these keys anyway; keep them in Spanish even though we never ask for "always".
        locationAlwaysAndWhenInUsePermission: LOCATION_PERMISSION,
        locationAlwaysPermission: LOCATION_PERMISSION,
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    ...(GOOGLE_IOS_URL_SCHEME
      ? [
          [
            '@react-native-google-signin/google-signin',
            { iosUrlScheme: GOOGLE_IOS_URL_SCHEME },
          ] as [string, Record<string, string>],
        ]
      : []),
  ],
  experiments: {
    // Off: the typed-routes generator mis-scans this pnpm monorepo on Windows (lists non-route
    // files, drops real routes). Revisit on the next Expo SDK.
    typedRoutes: false,
    reactCompiler: true,
  },
};

export default config;
