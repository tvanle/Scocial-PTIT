/**
 * usePushNotifications Hook
 *
 * Hook for managing push notifications in components
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import pushNotificationService, { PushNotificationData } from '../services/push/pushNotificationService';
import { useAuthStore } from '../store/slices/authSlice';

export function usePushNotifications() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const lastNotificationResponse = useRef<Notifications.NotificationResponse | null>(null);

  // Handle notification received while app is open
  const handleNotificationReceived = useCallback(
    (notification: Notifications.Notification) => {
      const rawData = notification.request.content.data;
      const data = rawData as unknown as PushNotificationData | undefined;

      // Refresh relevant data
      if (data?.type === 'match') {
        queryClient.invalidateQueries({ queryKey: ['dating', 'matches'] });
      } else if (data?.type === 'like') {
        queryClient.invalidateQueries({ queryKey: ['dating', 'likes'] });
      } else if (data?.type === 'message') {
        queryClient.invalidateQueries({ queryKey: ['dating', 'chat'] });
      }

      // Always refresh notifications count
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    [queryClient],
  );

  // Handle notification tap - just refresh queries, navigation handled elsewhere
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const rawData = response.notification.request.content.data;
      const data = rawData as unknown as PushNotificationData | undefined;

      lastNotificationResponse.current = response;

      if (!data) return;

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Refresh based on notification type
      switch (data.type) {
        case 'match':
          queryClient.invalidateQueries({ queryKey: ['dating', 'matches'] });
          break;
        case 'like':
          queryClient.invalidateQueries({ queryKey: ['dating', 'likes'] });
          break;
        case 'message':
          queryClient.invalidateQueries({ queryKey: ['dating', 'chat'] });
          break;
      }
    },
    [queryClient],
  );

  // Initialize push notifications when authenticated
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!isAuthenticated || !user) {
        // Cleanup on logout
        pushNotificationService.removeListeners();
        setIsInitialized(false);
        setHasPermission(false);
        return;
      }

      try {
        const token = await pushNotificationService.initialize();
        if (!mounted) return;

        setIsInitialized(!!token);
        setHasPermission(!!token);

        if (token) {
          pushNotificationService.setupListeners(
            handleNotificationReceived,
            handleNotificationResponse,
          );
        }
      } catch (error) {
        console.error('[usePushNotifications] Init error:', error);
      }
    };

    init();

    return () => {
      mounted = false;
      pushNotificationService.removeListeners();
    };
  }, [isAuthenticated, user, handleNotificationReceived, handleNotificationResponse]);

  // Request permission manually
  const requestPermission = useCallback(async () => {
    const granted = await pushNotificationService.requestPermission();
    setHasPermission(granted);

    if (granted && isAuthenticated) {
      const token = await pushNotificationService.initialize();
      setIsInitialized(!!token);
    }

    return granted;
  }, [isAuthenticated]);

  // Unregister on logout
  const unregister = useCallback(async () => {
    await pushNotificationService.unregister();
    setIsInitialized(false);
  }, []);

  return {
    isInitialized,
    hasPermission,
    requestPermission,
    unregister,
    lastNotificationResponse: lastNotificationResponse.current,
    clearNotifications: pushNotificationService.clearAllNotifications.bind(pushNotificationService),
    setBadgeCount: pushNotificationService.setBadgeCount.bind(pushNotificationService),
  };
}
