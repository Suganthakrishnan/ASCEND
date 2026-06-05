import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { TabNavigator } from './TabNavigator';
import { GenericPlaceholder } from '../screens/main/GenericPlaceholder';
import { SplashLoadingScreen } from '../screens/SplashLoadingScreen';
import { theme } from '../constants/theme';

const RootStack = createNativeStackNavigator();

export function AppNavigator() {
  const { session, isLoading, isOnboardingComplete } = useAuthContext();

  if (isLoading) return <SplashLoadingScreen />;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          // No session → Auth screens
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : !isOnboardingComplete ? (
          // Signed in but onboarding not complete → Onboarding
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          // Fully authenticated → Main app
          <>
            <RootStack.Screen name="MainTabs" component={TabNavigator} />
            <RootStack.Screen name="WorkoutPlanner" component={GenericPlaceholder}
              options={{ headerShown: true, headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.text, title: 'WORKOUT PLANNER' }} />
            <RootStack.Screen name="SleepTracker" component={GenericPlaceholder}
              options={{ headerShown: true, headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.text, title: 'SLEEP TRACKER' }} />
            <RootStack.Screen name="ScreenTime" component={GenericPlaceholder}
              options={{ headerShown: true, headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.text, title: 'SCREEN TIME' }} />
            <RootStack.Screen name="ProgressAnalytics" component={GenericPlaceholder}
              options={{ headerShown: true, headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.text, title: 'ANALYTICS' }} />
            <RootStack.Screen name="AchievementsRank" component={GenericPlaceholder}
              options={{ headerShown: true, headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.text, title: 'ACHIEVEMENTS' }} />
            <RootStack.Screen name="CalendarSchedule" component={GenericPlaceholder}
              options={{ headerShown: true, headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.text, title: 'SCHEDULE' }} />
            <RootStack.Screen name="NotificationsCenter" component={GenericPlaceholder}
              options={{ headerShown: true, headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.text, title: 'NOTIFICATIONS' }} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
