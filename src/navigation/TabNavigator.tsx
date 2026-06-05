import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeDashboard } from '../screens/main/HomeDashboard';
import { WorkoutProgress } from '../screens/main/WorkoutProgress';
import { PendingWorks } from '../screens/main/PendingWorks';
import { Profile } from '../screens/main/Profile';
import { theme } from '../constants/theme';
import { User, Activity, CheckSquare, Shield } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.background, shadowColor: 'transparent', elevation: 0 },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '900', letterSpacing: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return <Shield color={color} size={size} strokeWidth={focused ? 3 : 2} />;
          } else if (route.name === 'Progress') {
            return <Activity color={color} size={size} strokeWidth={focused ? 3 : 2} />;
          } else if (route.name === 'Directives') {
            return <CheckSquare color={color} size={size} strokeWidth={focused ? 3 : 2} />;
          } else if (route.name === 'Player') {
            return <User color={color} size={size} strokeWidth={focused ? 3 : 2} />;
          }
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textDimmed,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeDashboard} options={{ title: 'SYSTEM' }} />
      <Tab.Screen name="Progress" component={WorkoutProgress} options={{ title: 'STATUS' }} />
      <Tab.Screen name="Directives" component={PendingWorks} options={{ title: 'QUESTS' }} />
      <Tab.Screen name="Player" component={Profile} options={{ title: 'PROFILE' }} />
    </Tab.Navigator>
  );
}
