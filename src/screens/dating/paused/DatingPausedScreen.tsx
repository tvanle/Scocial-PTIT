import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { DATING_COLORS } from '../../../constants/dating/theme';
import { DATING_SPACING, DATING_RADIUS, DATING_FONT_SIZE } from '../../../constants/dating/tokens';
import datingService from '../../../services/dating/datingService';
import type { RootStackParamList } from '../../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DatingPausedScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [isResuming, setIsResuming] = useState(false);

  const handleResume = useCallback(async () => {
    setIsResuming(true);
    try {
      await datingService.updateProfile({ isActive: true });
      queryClient.invalidateQueries({ queryKey: ['dating'] });
      navigation.replace('DatingDiscovery');
    } catch {
      Alert.alert('Lỗi', 'Không thể kích hoạt lại hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsResuming(false);
    }
  }, [navigation, queryClient]);

  const handleBackToSocial = useCallback(() => {
    navigation.navigate('Main');
  }, [navigation]);

  const handleDeleteProfile = useCallback(() => {
    Alert.alert(
      'Xoá hồ sơ hẹn hò',
      'Hồ sơ hẹn hò của bạn sẽ bị xoá vĩnh viễn. Bạn có chắc không?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            try {
              await datingService.deleteProfile();
              queryClient.invalidateQueries({ queryKey: ['dating'] });
              navigation.replace('DatingSplash');
            } catch {
              Alert.alert('Lỗi', 'Không thể xoá hồ sơ. Vui lòng thử lại.');
            }
          },
        },
      ],
    );
  }, [navigation, queryClient]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToSocial} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={DATING_COLORS.light.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="pause-circle" size={80} color={DATING_COLORS.primary} />
        </View>

        <Text style={styles.title}>Hồ sơ đang tạm dừng</Text>
        <Text style={styles.subtitle}>
          Hồ sơ hẹn hò của bạn hiện không hiển thị với người khác. Kích hoạt lại để tiếp tục
          khám phá.
        </Text>

        <TouchableOpacity
          style={styles.resumeBtn}
          onPress={handleResume}
          disabled={isResuming}
          activeOpacity={0.8}
        >
          {isResuming ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="heart" size={20} color="#fff" />
              <Text style={styles.resumeBtnText}>Kích hoạt lại</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteProfile}
          activeOpacity={0.7}
        >
          <MaterialIcons name="delete-outline" size={18} color={DATING_COLORS.primary} />
          <Text style={styles.deleteBtnText}>Xoá hồ sơ hẹn hò</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DATING_COLORS.light.background,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: DATING_SPACING.md,
    paddingVertical: DATING_SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DATING_SPACING.xl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${DATING_COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DATING_SPACING.xl,
  },
  title: {
    fontSize: DATING_FONT_SIZE.xxl,
    fontWeight: '700',
    color: DATING_COLORS.light.textPrimary,
    textAlign: 'center',
    marginBottom: DATING_SPACING.sm,
  },
  subtitle: {
    fontSize: DATING_FONT_SIZE.md,
    color: DATING_COLORS.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: DATING_SPACING.xxl,
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 52,
    backgroundColor: DATING_COLORS.primary,
    borderRadius: DATING_RADIUS.lg,
    marginBottom: DATING_SPACING.md,
  },
  resumeBtnText: {
    fontSize: DATING_FONT_SIZE.lg,
    fontWeight: '700',
    color: '#fff',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: DATING_SPACING.sm,
  },
  deleteBtnText: {
    fontSize: DATING_FONT_SIZE.sm,
    color: DATING_COLORS.primary,
    fontWeight: '500',
  },
});

export default DatingPausedScreen;
