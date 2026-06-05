import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { usePersistence } from '../../hooks/usePersistence';

export function SyncStatusBar() {
  const { syncStatus, pendingQueueCount, isOnline, syncNow, lastSyncError } = usePersistence();

  if (isOnline && syncStatus === 'idle' && pendingQueueCount === 0) {
    return null;
  }

  const isSyncing = syncStatus === 'syncing';

  return (
    <TouchableOpacity
      style={[styles.bar, !isOnline && styles.barOffline, pendingQueueCount > 0 && styles.barPending]}
      onPress={syncNow}
      activeOpacity={0.8}
      disabled={isSyncing}
    >
      {isSyncing ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : isOnline ? (
        <RefreshCw color={theme.colors.primary} size={14} />
      ) : (
        <CloudOff color={theme.colors.warning} size={14} />
      )}
      <Text style={styles.text}>
        {!isOnline
          ? `OFFLINE${pendingQueueCount > 0 ? ` · ${pendingQueueCount} pending` : ''}`
          : pendingQueueCount > 0
            ? `${pendingQueueCount} change(s) queued — tap to sync`
            : lastSyncError ?? 'Sync issue — tap to retry'}
      </Text>
      {isOnline && pendingQueueCount === 0 && syncStatus === 'idle' && (
        <Cloud color={theme.colors.textDimmed} size={12} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(109, 221, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ghostBorder,
  },
  barOffline: {
    backgroundColor: 'rgba(255, 217, 61, 0.08)',
  },
  barPending: {
    backgroundColor: 'rgba(172, 137, 255, 0.1)',
  },
  text: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textDimmed,
    letterSpacing: 0.5,
  },
});
