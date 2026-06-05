import { SafeAreaView, StyleSheet, ViewStyle, View } from 'react-native';
import { theme } from '../../constants/theme';
import { SyncStatusBar } from '../ui/SyncStatusBar';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  showSyncBar?: boolean;
}

export function ScreenWrapper({ children, style, showSyncBar = true }: ScreenWrapperProps) {
  return (
    <SafeAreaView style={[styles.container, style]}>
      {showSyncBar && <SyncStatusBar />}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
});
