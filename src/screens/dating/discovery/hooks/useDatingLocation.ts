import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { useQueryClient } from '@tanstack/react-query';
import datingService from '../../../../services/dating/datingService';

const DISCOVERY_QUERY_KEY = ['dating', 'discovery'] as const;
const PROFILE_ME_QUERY_KEY = ['dating', 'profile', 'me'] as const;

export type DatingLocationResult =
  | { ok: true }
  | { ok: false; reason: 'denied' | 'unavailable' | 'error'; message?: string };

/**
 * Yêu cầu quyền định vị, lấy tọa độ hiện tại và gửi lên server.
 * Sau khi thành công sẽ invalidate discovery + profile để cập nhật khoảng cách.
 */
export function useDatingLocation() {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const requestAndUpdateLocation = useCallback(async (): Promise<DatingLocationResult> => {
    setIsUpdating(true);
    setLastError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLastError('Bạn chưa cho phép truy cập vị trí.');
        return { ok: false, reason: 'denied', message: 'Bạn chưa cho phép truy cập vị trí.' };
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;

      await datingService.updateLocation({ latitude, longitude });
      queryClient.invalidateQueries({ queryKey: DISCOVERY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROFILE_ME_QUERY_KEY });
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không lấy được vị trí.';
      setLastError(message);
      return {
        ok: false,
        reason: 'error',
        message,
      };
    } finally {
      setIsUpdating(false);
    }
  }, [queryClient]);

  return { requestAndUpdateLocation, isUpdating, lastError };
}
