import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type Session, type User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

// Supabase auth redirects (email confirmation, OAuth) carry the session as
// access_token/refresh_token in the URL fragment, which never reaches a
// server, so the client has to parse it out and apply it manually.
export function extractSessionTokens(url: string): { access_token: string; refresh_token: string } | null {
  const hashIndex = url.indexOf('#');
  const params = new URLSearchParams(hashIndex >= 0 ? url.slice(hashIndex + 1) : '');
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  return access_token && refresh_token ? { access_token, refresh_token } : null;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string, username: string) => Promise<{ error: string | null; needsConfirm: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null; cancelled?: boolean }>;
  updateUsername: (username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithPassword = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim() },
        emailRedirectTo: Linking.createURL('auth/callback'),
      },
    });
    if (error) return { error: error.message, needsConfirm: false };
    return { error: null, needsConfirm: !data.session };
  };

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response) || !response.data.idToken) {
        return { error: null, cancelled: true };
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.data.idToken,
      });
      return { error: error?.message ?? null };
    } catch (e) {
      if (isErrorWithCode(e)) {
        if (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS) {
          return { error: null, cancelled: true };
        }
        if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          return { error: 'Google Play Services is required for Google sign-in.' };
        }
      }
      return { error: 'Google sign-in failed.' };
    }
  };

  const updateUsername = async (username: string) => {
    const { error } = await supabase.auth.updateUser({
      data: { username: username.trim() },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await GoogleSignin.signOut().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      signInWithPassword, signUpWithPassword, signInWithGoogle,
      updateUsername, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
