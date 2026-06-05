import { supabase } from './supabase';

/** Sign in an existing user with email + password */
export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign up a new user.
 * Profile row is created automatically by the Postgres trigger
 * `on_auth_user_created` on auth.users — see supabase_setup.sql.
 */
export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

/** Sign the current user out */
export async function signOut() {
  return supabase.auth.signOut();
}

/** Reset password for user */
export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:8081', // Your app's URL
  });
}

/** Get the current active session (async, reads from storage) */
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Google OAuth – STUB
 * TODO: Configure Google OAuth in Supabase dashboard, then replace this with:
 *   supabase.auth.signInWithOAuth({ provider: 'google', ... })
 */
export async function googleSignIn(): Promise<{ url: string | null; error: string }> {
  return { url: null, error: 'Google sign-in is coming soon.' };
}
