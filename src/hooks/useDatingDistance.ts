/**
 * useDatingDistance Hook
 *
 * Hook for managing distance display in dating features
 */

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { useQueryClient } from '@tanstack/react-query';
import datingService from '../services/dating/datingService';
import datingSettingsService from '../services/dating/datingSettingsService';

export interface UseDatingDistanceOptions {
  autoUpdate?: boolean;
}

export function useDatingDistance(options: UseDatingDistanceOptions = {}) {
  const { autoUpdate = false } = options;
  const queryClient = useQueryClient();

  const [isUpdating, setIsUpdating] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [shouldShowDistance, setShouldShowDistance] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Check permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setHasPermission(status === 'granted');

        // Load show distance setting
        const showDist = await datingSettingsService.shouldShowDistance();
        setShouldShowDistance(showDist);
      } catch (error) {
        console.error('[useDatingDistance] Check permission error:', error);
      }
    };

    checkPermission();
  }, []);

  // Auto update location if enabled
  useEffect(() => {
    if (!autoUpdate || !hasPermission) return;

    const updateLocation = async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        await datingService.updateLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('[useDatingDistance] Auto update error:', error);
      }
    };

    updateLocation();
  }, [autoUpdate, hasPermission]);

  // Request permission and update location
  const requestAndUpdate = useCallback(async (): Promise<boolean> => {
    setIsUpdating(true);
    setLastError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setHasPermission(false);
        setLastError('Quyen vi tri chua duoc cap.');
        return false;
      }

      setHasPermission(true);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);

      await datingService.updateLocation(coords);

      // Invalidate queries to refresh distances
      queryClient.invalidateQueries({ queryKey: ['dating', 'discovery'] });
      queryClient.invalidateQueries({ queryKey: ['dating', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['dating', 'feed'] });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Khong the cap nhat vi tri.';
      setLastError(message);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [queryClient]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback(
    (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number,
    ): number => {
      const R = 6371; // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    [],
  );

  // Format distance for display
  const formatDistance = useCallback(
    (distanceKm: number | null | undefined): string => {
      if (!shouldShowDistance) return '';
      if (distanceKm === null || distanceKm === undefined) return '';

      if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m`;
      }

      if (distanceKm < 10) {
        return `${distanceKm.toFixed(1)}km`;
      }

      return `${Math.round(distanceKm)}km`;
    },
    [shouldShowDistance],
  );

  // Get distance from current location to a point
  const getDistanceFromCurrent = useCallback(
    (lat: number, lon: number): number | null => {
      if (!currentLocation) return null;
      return calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        lat,
        lon,
      );
    },
    [currentLocation, calculateDistance],
  );

  // Toggle show distance setting
  const toggleShowDistance = useCallback(async (value: boolean) => {
    setShouldShowDistance(value);
    await datingSettingsService.updatePrivacySettings({ showDistance: value });
  }, []);

  return {
    isUpdating,
    lastError,
    hasPermission,
    shouldShowDistance,
    currentLocation,
    requestAndUpdate,
    calculateDistance,
    formatDistance,
    getDistanceFromCurrent,
    toggleShowDistance,
  };
}
