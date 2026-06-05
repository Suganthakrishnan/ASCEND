import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { signInWithEmail, signUpWithEmail, signOut as authSignOut } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  const fetchOnboardingStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', userId)
        .single();
      if (error) return false; // Table may not exist yet — safe fallback
      return data?.onboarding_complete ?? false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const onboarded = await fetchOnboardingStatus(session.user.id);
        if (mounted) setIsOnboardingComplete(onboarded);
      }
      if (mounted) setIsLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const onboarded = await fetchOnboardingStatus(session.user.id);
        if (mounted) setIsOnboardingComplete(onboarded);
      } else {
        setIsOnboardingComplete(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = (email: string, password: string) => signInWithEmail(email, password);
  const signUp = (email: string, password: string) => signUpWithEmail(email, password);
  const signOut = () => authSignOut();

  const completeOnboarding = async (): Promise<{ error: any }> => {
    if (!user) return { error: new Error('No authenticated user') };
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_complete: true })
      .eq('id', user.id);
    if (!error) setIsOnboardingComplete(true);
    return { error };
  };

  return { user, session, isLoading, isOnboardingComplete, signIn, signUp, signOut, completeOnboarding };
}
