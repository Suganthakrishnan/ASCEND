import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// Environment-aware configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
/* SECURITY: do not log */
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[SystemFit] Missing Supabase credentials.\n' +
    'Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY ' +
    'are set in your .env file, then STOP and RESTART expo (npx expo start -c).'
  );
}

// Security check: warn if using localhost in production build
if (__DEV__ === false && (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1'))) {
  console.warn(
    '[Security] WARNING: Using localhost Supabase URL in production build. ' +
    'This may cause connectivity issues in production.'
  );
}

// Log environment for debugging (development only)
if (__DEV__) {
  console.log('[SystemFit] Environment:', __DEV__ ? 'development' : 'production');
  console.log('[SystemFit] Supabase URL:', supabaseUrl.replace(/https?:\/\/[^@]+@/, 'https://***@'));
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Automatically refresh the session token when the app returns to the foreground
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
