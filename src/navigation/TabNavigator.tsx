import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeDashboard } from '../screens/main/HomeDashboard';
import { WorkoutProgress } from '../screens/main/WorkoutProgress';
import { DailyTasks } from '../screens/main/DailyTasks';
import { Profile } from '../screens/main/Profile';
import { theme } from '../constants/theme';
import { CustomTabBar } from '../components/ui/CustomTabBar';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#080B12', shadowColor: 'transparent', elevation: 0 },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: { fontWeight: '900', letterSpacing: 2, fontSize: 14 },
        sceneStyle: { backgroundColor: '#080B12' },
      }}
    >
      <Tab.Screen name="Home" component={HomeDashboard} options={{ title: 'SYSTEM' }} />
      <Tab.Screen name="Progress" component={WorkoutProgress} options={{ title: 'STATUS' }} />
      <Tab.Screen name="DailyTasks" component={DailyTasks} options={{ title: 'TASKS' }} />
      <Tab.Screen name="Player" component={Profile} options={{ title: 'PROFILE' }} />
    </Tab.Navigator>
  );
}
