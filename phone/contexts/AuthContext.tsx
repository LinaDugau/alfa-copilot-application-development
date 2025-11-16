import { EncryptedStorage } from '../utils/encrypted-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

const AUTH_KEY = '@auth_completed';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const loadAuthState = useCallback(async () => {
    try {
      const value = await EncryptedStorage.getItem(AUTH_KEY);
      setIsAuthenticated(value === 'true');
    } catch (error) {
      console.error('Error loading auth state:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  useEffect(() => {
    if (isLoading || isAuthenticated === null) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/phone');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading, router]);

  const completeAuth = useCallback(async () => {
    try {
      await EncryptedStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await EncryptedStorage.removeItem(AUTH_KEY);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  return useMemo(() => ({
    isAuthenticated,
    isLoading,
    completeAuth,
    logout,
  }), [isAuthenticated, isLoading, completeAuth, logout]);
});

