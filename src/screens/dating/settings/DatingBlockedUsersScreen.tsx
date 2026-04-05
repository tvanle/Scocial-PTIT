/**
 * Dating Blocked Users Screen
 *
 * Manage blocked users in dating feature
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { DatingThemeProvider, useDatingTheme } from '../../../contexts/DatingThemeContext';
import { SPACING, TEXT_STYLES, RADIUS, DURATION } from '../../../constants/dating/design-system';
import type { RootStackParamList } from '../../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const AVATAR_SIZE = 52;

interface BlockedUser {
  id: string;
  userId: string;
  fullName: string;
  avatar: string | null;
  blockedAt: string;
}

interface BlockedUserRowProps {
  item: BlockedUser;
  index: number;
  onUnblock: (user: BlockedUser) => void;
}

const BlockedUserRow: React.FC<BlockedUserRowProps> = React.memo(({ item, index, onUnblock }) => {
  const { theme } = useDatingTheme();

  const handleUnblock = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUnblock(item);
  }, [item, onUnblock]);

  return (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(DURATION.normal)}>
      <View style={[styles.userRow, { backgroundColor: theme.bg.surface }]}>
        <View style={styles.userAvatarWrap}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.userAvatar, styles.userAvatarPlaceholder, { backgroundColor: theme.bg.elevated }]}>
              <Ionicons name="person" size={24} color={theme.text.muted} />
            </View>
          )}
        </View>

        <View style={styles.userBody}>
          <Text style={[styles.userName, { color: theme.text.primary }]} numberOfLines={1}>
            {item.fullName}
          </Text>
          <Text style={[styles.userInfo, { color: theme.text.muted }]}>
            Da chan
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.unblockBtn, { backgroundColor: theme.brand.primaryMuted }]}
          onPress={handleUnblock}
          activeOpacity={0.7}
        >
          <Text style={[styles.unblockBtnText, { color: theme.brand.primary }]}>Bo chan</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

const BlockedUsersInner: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { theme } = useDatingTheme();

  // For now, use empty array since backend doesn't have blocked users API yet
  // This will be populated when the API is available
  const blockedUsers: BlockedUser[] = [];
  const isLoading = false;

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleUnblock = useCallback((user: BlockedUser) => {
    Alert.alert(
      'Bo chan nguoi dung',
      `Ban co chac chan muon bo chan ${user.fullName}? Ho se co the nhin thay ho so cua ban.`,
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Bo chan',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // TODO: Call API to unblock user when available
            Alert.alert('Thanh cong', `Da bo chan ${user.fullName}`);
          },
        },
      ]
    );
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: BlockedUser; index: number }) => (
      <BlockedUserRow item={item} index={index} onUnblock={handleUnblock} />
    ),
    [handleUnblock]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border.subtle }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialCommunityIcons name="cancel" size={20} color={theme.semantic.nope.main} />
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Nguoi dung bi chan</Text>
          </View>
          <View style={styles.headerBtnPlaceholder} />
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.brand.primary} />
          </View>
        ) : blockedUsers.length === 0 ? (
          <Animated.View entering={FadeIn.duration(DURATION.slow)} style={styles.center}>
            <View style={[styles.emptyIconOuter, { backgroundColor: theme.brand.primaryMuted }]}>
              <MaterialCommunityIcons name="account-check" size={48} color={theme.brand.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
              Khong co nguoi dung bi chan
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text.muted }]}>
              Khi ban chan ai do trong phan hen ho, ho se xuat hien o day
            </Text>
          </Animated.View>
        ) : (
          <FlatList
            data={blockedUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: theme.border.subtle }]} />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export const DatingBlockedUsersScreen: React.FC = () => {
  return (
    <DatingThemeProvider>
      <BlockedUsersInner />
    </DatingThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPlaceholder: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  headerTitle: {
    ...TEXT_STYLES.headingMedium,
  },

  // Center / Empty
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    ...TEXT_STYLES.headingMedium,
    textAlign: 'center',
  },
  emptySubtext: {
    ...TEXT_STYLES.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },

  // List
  listContent: {
    paddingBottom: SPACING.xl,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 80,
  },

  // User row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  userAvatarWrap: {
    marginRight: SPACING.sm,
  },
  userAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  userAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBody: {
    flex: 1,
  },
  userName: {
    ...TEXT_STYLES.labelMedium,
    fontWeight: '600',
    marginBottom: 2,
  },
  userInfo: {
    ...TEXT_STYLES.bodySmall,
  },
  unblockBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  unblockBtnText: {
    ...TEXT_STYLES.labelSmall,
    fontWeight: '600',
  },
});

export default DatingBlockedUsersScreen;
