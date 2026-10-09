import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  role: 'admin' | 'agent' | 'anon';
  isLoading: boolean;
}

/**
 * Sign in with Google OAuth via Supabase
 */
export async function signInWithGoogle(redirectTo?: string) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || window.location.origin,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign up with Email and Password
 */
export async function signUpWithEmail(email: string, password: string, fullName: string) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  if (!isSupabaseConfigured() || !supabase) {
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Subscribe to Supabase auth state changes
 */
export function subscribeToAuth(callback: (user: User | null, session: Session | null) => void) {
  if (!isSupabaseConfigured() || !supabase) {
    callback(null, null);
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null, session);
  });

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Fetch user profile role from public.profiles
 */
export async function fetchUserRole(userId: string): Promise<'admin' | 'agent'> {
  if (!isSupabaseConfigured() || !supabase) {
    return 'agent';
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return 'agent';
  }

  return (data.role as 'admin' | 'agent') || 'agent';
}
