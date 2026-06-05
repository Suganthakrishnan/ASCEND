 import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { signInWithEmail, signUpWithEmail, signOut as authSignOut } from '../services/authService';
import { RateLimiter, SessionTimer, sanitizeText, validateEmail } from '../services/securityService';

// Race a promise against a timeout
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Security instances
  const rateLimiter = RateLimiter.getInstance();
  const sessionTimer = new SessionTimer();

  const enterDemoMode = () => {
    setIsDemoMode(true);
    setIsOnboardingComplete(true);
    setIsLoading(false);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setSession(null);
    setUser(null);
    setIsOnboardingComplete(false);
  };

  const fetchOnboardingStatus = async (userId: string): Promise<boolean> => {
    try {
      console.log('[SystemFit] Fetching onboarding status for user:', userId);
      
      // Check if user has biometric data in user_preferences table
      const queryPromise = supabase
        .from('user_preferences')
        .select('age, weight, height')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 15 seconds')), 15000)
      );
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      console.log('[SystemFit] Query result - data:', data, 'error:', error);
      
      if (error) {
        console.error('[SystemFit] Error fetching onboarding status:', error);
        console.error('[SystemFit] Error details:', JSON.stringify(error));
        return false;
      }
      
      if (!data) {
        console.warn('[SystemFit] No user preferences found for user:', userId);
        return false;
      }
      
      // Check if user has biometric data (age, weight, height)
      const hasBiometricData = !!(data.age && data.weight && data.height);
      console.log('[SystemFit] Onboarding status for user', userId, ':', hasBiometricData, '(has biometric data)');
      return hasBiometricData;
    } catch (err) {
      console.error('[SystemFit] Exception fetching onboarding status:', err);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('[SystemFit] Initializing auth...');
        const sessionResult = await withTimeout(
          supabase.auth.getSession(),
          2000, // 2s timeout — faster fallback
          { data: { session: null }, error: null } as any
        );

        const currentSession = sessionResult.data?.session ?? null;
        console.log('[SystemFit] Session retrieved:', currentSession ? 'exists' : 'null');
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          console.log('[SystemFit] User authenticated, fetching onboarding status...');
          const onboarded = await fetchOnboardingStatus(currentSession.user.id);
          console.log('[SystemFit] Setting onboarding complete to:', onboarded);
          if (mounted) setIsOnboardingComplete(onboarded);
        }
      } catch (e) {
        console.warn('[SystemFit] Auth init error:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[SystemFit] Auth state changed. Event:', event, 'Session:', session ? 'exists' : 'null');
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('[SystemFit] User authenticated after state change, fetching onboarding status...');
        const onboarded = await fetchOnboardingStatus(session.user.id);
        console.log('[SystemFit] Setting onboarding complete to:', onboarded);
        if (mounted) setIsOnboardingComplete(onboarded);
      } else {
        console.log('[SystemFit] No user session, setting onboarding complete to false');
        setIsOnboardingComplete(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Sanitize and validate email
    const sanitizedEmail = sanitizeText(email);
    if (!validateEmail(sanitizedEmail)) {
      return { error: { message: 'Invalid email format' } };
    }

    // Rate limiting: max 5 attempts per 15 minutes
    if (!rateLimiter.check('login', 5, 15 * 60 * 1000)) {
      return { error: { message: 'Too many login attempts. Please wait 15 minutes.' } };
    }

    const result = await signInWithEmail(sanitizedEmail, password);

    // Start session timer on successful sign in (30 minutes)
    if (!result.error && result.data?.session) {
      sessionTimer.start(30 * 60 * 1000, async () => {
        await authSignOut();
      });
    }

    return result;
  };

  const signUp = async (email: string, password: string) => {
    // Sanitize and validate email
    const sanitizedEmail = sanitizeText(email);
    if (!validateEmail(sanitizedEmail)) {
      return { error: { message: 'Invalid email format' } };
    }

    // Rate limiting: max 5 attempts per 15 minutes
    if (!rateLimiter.check('register', 5, 15 * 60 * 1000)) {
      return { error: { message: 'Too many registration attempts. Please wait 15 minutes.' } };
    }

    return signUpWithEmail(sanitizedEmail, password);
  };

  const signOut = async () => {
    // Clear session timer
    sessionTimer.clear();
    
    if (isDemoMode) { 
      exitDemoMode(); 
      return { error: null }; 
    }
    return authSignOut();
  };

  const resetSessionTimer = () => {
    sessionTimer.reset();
  };

  const completeOnboarding = async (): Promise<{ error: any }> => {
    if (!user) return { error: new Error('No authenticated user') };
    
    console.log('[SystemFit] Completing onboarding for user:', user.id);
    
    // Use UPSERT to prevent duplicate inserts
    const { error, data } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id, 
        onboarding_complete: true,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) {
      console.error('[SystemFit] Error completing onboarding:', error);
      console.error('[SystemFit] Error details:', JSON.stringify(error));
      return { error };
    }
    
    console.log('[SystemFit] Onboarding update successful. Data:', data);
    setIsOnboardingComplete(true);
    
    // Verify the update was successful
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single();
    
    if (verifyError) {
      console.error('[SystemFit] Verification error:', verifyError);
    } else {
      console.log('[SystemFit] Verification - onboarding_complete status:', verifyData?.onboarding_complete);
    }
    
    return { error: null };
  };

  return { user, session, isLoading, isOnboardingComplete, isDemoMode, signIn, signUp, signOut, completeOnboarding, enterDemoMode, resetSessionTimer };
}
