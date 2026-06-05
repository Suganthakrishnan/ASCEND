import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  subscribePersistence,
  getPersistenceState,
  syncPendingChanges,
  initPersistenceSync,
  checkIsOnline,
  type SyncStatus,
} from '../services/persistence/persistenceService';
import { useAuthContext } from './AuthContext';

interface PersistenceContextType {
  syncStatus: SyncStatus;
  pendingQueueCount: number;
  lastSyncAt: number | null;
  lastSyncError: string | null;
  isOnline: boolean;
  syncNow: () => Promise<void>;
}

const PersistenceContext = createContext<PersistenceContextType | null>(null);

export function PersistenceProvider({ children }: { children: ReactNode }) {
  const { user, session, isDemoMode } = useAuthContext();
  const [state, setState] = useState(getPersistenceState);
  const [isOnline, setIsOnline] = useState(true);

  const refresh = useCallback(() => {
    setState(getPersistenceState());
  }, []);

  useEffect(() => {
    initPersistenceSync();
    const unsub = subscribePersistence(refresh);
    return unsub;
  }, [refresh]);

  useEffect(() => {
    let mounted = true;
    const probe = async () => {
      const online = await checkIsOnline();
      if (mounted) setIsOnline(online);
    };
    probe();
    const id = setInterval(probe, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (user?.id && session && !isDemoMode) {
      void syncPendingChanges();
    }
  }, [user?.id, session, isDemoMode]);

  const syncNow = useCallback(async () => {
    await syncPendingChanges();
    setIsOnline(await checkIsOnline());
    refresh();
  }, [refresh]);

  return (
    <PersistenceContext.Provider
      value={{
        syncStatus: state.syncStatus,
        pendingQueueCount: state.pendingQueueCount,
        lastSyncAt: state.lastSyncAt,
        lastSyncError: state.lastSyncError,
        isOnline,
        syncNow,
      }}
    >
      {children}
    </PersistenceContext.Provider>
  );
}

export function usePersistenceContext(): PersistenceContextType {
  const ctx = useContext(PersistenceContext);
  if (!ctx) throw new Error('usePersistenceContext must be used within PersistenceProvider');
  return ctx;
}
