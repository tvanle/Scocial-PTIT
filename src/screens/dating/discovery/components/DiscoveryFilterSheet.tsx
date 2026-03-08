import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DATING_COLORS } from '../../../../constants/dating/theme';
import datingService from '../../../../services/dating/datingService';
import { DatingFilterForm } from '../../components/DatingFilterForm';
import type { DatingFilterValues } from '../../../../types/dating';

const colors = DATING_COLORS.preferences;
const DISCOVERY_QUERY_KEY = ['dating', 'discovery'] as const;

interface DiscoveryFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Gọi sau khi lưu preferences xong; nên await để refetch discovery trước khi đóng sheet */
  onFilterApplied?: () => void | Promise<void>;
}

export const DiscoveryFilterSheet: React.FC<DiscoveryFilterSheetProps> = ({
  visible,
  onClose,
  onFilterApplied,
}) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['dating', 'profile', 'me'],
    queryFn: () => datingService.getMyProfile(),
    enabled: visible,
  });

  const initialValues = useMemo(() => {
    if (!profile?.preferences) return null;
    const p = profile.preferences;
    return {
      preferredGender: p.gender ?? null,
      maxDistanceKm: p.maxDistance ?? null,
      ageMin: p.ageMin,
      ageMax: p.ageMax,
      preferredMajor: p.preferredMajors?.[0] ?? null,
      sameYearOnly: p.sameYearOnly ?? false,
    };
  }, [profile?.preferences]);

  const handleApply = useCallback(
    async (values: DatingFilterValues) => {
      setLoading(true);
      try {
        await datingService.updatePreferences({
          ageMin: values.ageMin,
          ageMax: values.ageMax,
          gender: values.preferredGender,
          maxDistance: values.maxDistanceKm,
          preferredMajors: values.preferredMajor ? [values.preferredMajor] : [],
          sameYearOnly: values.sameYearOnly,
        });
        queryClient.invalidateQueries({ queryKey: ['dating', 'profile', 'me'] });
        if (onFilterApplied) {
          await onFilterApplied();
        } else {
          await queryClient.refetchQueries({ queryKey: DISCOVERY_QUERY_KEY });
        }
        onClose();
      } finally {
        setLoading(false);
      }
    },
    [queryClient, onClose, onFilterApplied],
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <DatingFilterForm
              initialValues={initialValues}
              onApply={handleApply}
              loading={loading}
            />
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    height: '66%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
});
