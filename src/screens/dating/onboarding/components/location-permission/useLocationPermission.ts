import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Linking } from 'react-native';
import datingService from '../../../../../services/dating/datingService';
import { LOCATION_PERMISSION_ALERTS } from './constants';

const DISCOVERY_QUERY_KEY = ['dating', 'discovery'] as const;
const PROFILE_ME_QUERY_KEY = ['dating', 'profile', 'me'] as const;

export interface UseLocationPermissionOptions {
  onSuccess: () => void;
}

export function useLocationPermission({ onSuccess }: UseLocationPermissionOptions) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const requestAndNavigate = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        Alert.alert(
          LOCATION_PERMISSION_ALERTS.permissionDenied.title,
          LOCATION_PERMISSION_ALERTS.permissionDenied.message,
          [
            { text: LOCATION_PERMISSION_ALERTS.permissionDenied.retry, onPress: () => requestAndNavigate() },
            { text: LOCATION_PERMISSION_ALERTS.permissionDenied.openSettings, onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;
      await datingService.updateLocation({ latitude, longitude });
      queryClient.invalidateQueries({ queryKey: PROFILE_ME_QUERY_KEY });
      await queryClient.refetchQueries({ queryKey: DISCOVERY_QUERY_KEY });
      onSuccess();
    } catch {
      setLoading(false);
      Alert.alert(
        LOCATION_PERMISSION_ALERTS.error.title,
        LOCATION_PERMISSION_ALERTS.error.message,
        [{ text: LOCATION_PERMISSION_ALERTS.error.retry, onPress: () => requestAndNavigate() }]
      );
    } finally {
      setLoading(false);
    }
  }, [queryClient, onSuccess]);

  return { requestAndNavigate, loading };
}
