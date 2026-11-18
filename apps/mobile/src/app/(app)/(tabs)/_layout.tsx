import { fontFamily } from '@crumbz/ui';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { Compass, House, UserRound, type LucideIcon } from 'lucide-react-native';

import { useColors } from '@/theme';

type TabIconProps = { color: ColorValue; focused: boolean };

// The tab bar always passes our own string tokens as the color.
function tabIcon(Icon: LucideIcon) {
  function TabIcon({ color, focused }: TabIconProps) {
    return <Icon size={24} color={color as string} strokeWidth={focused ? 2.25 : 1.75} />;
  }
  return TabIcon;
}

const HomeIcon = tabIcon(House);
const ExploreIcon = tabIcon(Compass);
const ProfileIcon = tabIcon(UserRound);

/**
 * Bottom navigation (Material: 3 destinations on a phone). Ink for the active tab,
 * muted for the rest, a hairline instead of a shadow (DESIGN: no elevation).
 * TODO(phase-5): add "Listas" when lists exist.
 */
export default function TabsLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.background,
          borderTopColor: c.line,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontFamily: fontFamily.native.regular, fontSize: 12 },
        sceneStyle: { backgroundColor: c.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: HomeIcon }} />
      <Tabs.Screen name="explore" options={{ title: 'Explorar', tabBarIcon: ExploreIcon }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ProfileIcon }} />
    </Tabs>
  );
}
