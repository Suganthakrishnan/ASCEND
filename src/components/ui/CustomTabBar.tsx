import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Shield, Activity, ListChecks, User } from 'lucide-react-native';
import { theme } from '../../constants/theme';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <BlurView tint="dark" intensity={20} style={StyleSheet.absoluteFillObject} />
      <View style={styles.content}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.title || route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const icon = () => {
            const iconColor = isFocused ? theme.colors.primary : '#FFFFFF';
            switch (route.name) {
              case 'Home':
                return <Shield size={24} strokeWidth={2} color={iconColor} />;
              case 'Progress':
                return <Activity size={24} strokeWidth={2} color={iconColor} />;
              case 'DailyTasks':
                return <ListChecks size={24} strokeWidth={2} color={iconColor} />;
              case 'Player':
                return <User size={24} strokeWidth={2} color={iconColor} />;
              default:
                return null;
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={onPress}
              activeOpacity={0.7}
              accessibilityLabel={label}
              accessibilityHint={isFocused ? `Currently viewing ${label}` : `Navigate to ${label}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
            >
              <Animated.View style={styles.iconContainer} accessibilityElementsHidden={true}>
                {icon()}
              </Animated.View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {label}
              </Text>
              {isFocused && <View style={styles.glowDot} accessible={false} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: theme.touch.tabBarHeight,
    borderTopWidth: 1,
    borderTopColor: theme.colors.bg.glassBorder,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    position: 'relative',
  },
  iconContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: theme.colors.text.secondary,
  },
  labelActive: {
    color: theme.colors.primary,
  },
  glowDot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
