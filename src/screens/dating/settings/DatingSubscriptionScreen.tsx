/**
 * Dating Subscription Screen
 *
 * Manage subscription: view status, usage, transaction history, upgrade
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { DatingThemeProvider, useDatingTheme } from '../../../contexts/DatingThemeContext';
import { SPACING, TEXT_STYLES, RADIUS, DURATION } from '../../../constants/dating/design-system';
import datingPaymentService, {
  SubscriptionInfo,
  UsageInfo,
  PaymentTransaction,
} from '../../../services/dating/datingPaymentService';
import type { RootStackParamList } from '../../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SubscriptionInner: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { theme } = useDatingTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch subscription info
  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['dating', 'subscription'],
    queryFn: () => datingPaymentService.getSubscriptionInfo(),
  });

  // Fetch transaction history
  const { data: txnData, isLoading: txnLoading } = useQuery({
    queryKey: ['dating', 'transactions'],
    queryFn: () => datingPaymentService.getTransactionHistory(1, 10),
  });

  const subscription = subData?.subscription;
  const usage = subData?.usage;
  const transactions = txnData?.transactions ?? [];

  const isPremium = subscription?.tier === 'PREMIUM' && subscription?.status === 'ACTIVE';

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['dating', 'subscription'] });
    await queryClient.invalidateQueries({ queryKey: ['dating', 'transactions'] });
    setRefreshing(false);
  }, [queryClient]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleUpgrade = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('DatingPremium');
  }, [navigation]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '#10B981';
      case 'PENDING':
        return '#F59E0B';
      case 'FAILED':
      case 'EXPIRED':
        return theme.semantic.nope.main;
      default:
        return theme.text.muted;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'Thành công';
      case 'PENDING':
        return 'Đang chờ';
      case 'FAILED':
        return 'Thất bại';
      case 'EXPIRED':
        return 'Hết hạn';
      default:
        return status;
    }
  };

  const renderTransaction = ({ item, index }: { item: PaymentTransaction; index: number }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 50).duration(DURATION.normal)}
      style={[styles.txnItem, { backgroundColor: theme.bg.surface }]}
    >
      <View style={styles.txnLeft}>
        <View style={[styles.txnIcon, { backgroundColor: theme.brand.primaryMuted }]}>
          <Ionicons name="diamond" size={18} color={theme.brand.primary} />
        </View>
        <View style={styles.txnInfo}>
          <Text style={[styles.txnPlan, { color: theme.text.primary }]}>
            Gói {item.planType === 'MONTHLY' ? '1 Tháng' : item.planType === 'QUARTERLY' ? '3 Tháng' : '1 Năm'}
          </Text>
          <Text style={[styles.txnDate, { color: theme.text.muted }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
      <View style={styles.txnRight}>
        <Text style={[styles.txnAmount, { color: theme.text.primary }]}>
          {formatCurrency(item.amount)}
        </Text>
        <View style={[styles.txnStatusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.txnStatusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  if (subLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.brand.primary} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border.subtle }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            Quản lý gói dịch vụ
          </Text>
          <View style={styles.headerBtnPlaceholder} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.brand.primary}
            />
          }
        >
          {/* Subscription Status Card */}
          <Animated.View
            entering={FadeInUp.duration(DURATION.normal)}
            style={[
              styles.statusCard,
              { backgroundColor: isPremium ? theme.brand.primary : theme.bg.surface },
            ]}
          >
            <View style={styles.statusHeader}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isPremium ? 'rgba(255,255,255,0.2)' : theme.brand.primaryMuted }
              ]}>
                <Ionicons
                  name={isPremium ? 'diamond' : 'person'}
                  size={24}
                  color={isPremium ? '#FFFFFF' : theme.brand.primary}
                />
              </View>
              <View style={styles.statusInfo}>
                <Text style={[
                  styles.statusTier,
                  { color: isPremium ? '#FFFFFF' : theme.text.primary }
                ]}>
                  {isPremium ? 'PTIT Premium' : 'Gói miễn phí'}
                </Text>
                <Text style={[
                  styles.statusDesc,
                  { color: isPremium ? 'rgba(255,255,255,0.8)' : theme.text.muted }
                ]}>
                  {isPremium
                    ? `Còn ${subscription?.daysRemaining} ngày`
                    : 'Nâng cấp để mở khóa tính năng'}
                </Text>
              </View>
            </View>

            {isPremium && subscription?.endDate && (
              <View style={[styles.expiryBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.expiryText}>
                  Hết hạn: {formatDate(subscription.endDate.toString())}
                </Text>
              </View>
            )}

            {!isPremium && (
              <TouchableOpacity
                style={[styles.upgradeBtn, { backgroundColor: theme.brand.primary }]}
                onPress={handleUpgrade}
                activeOpacity={0.8}
              >
                <Ionicons name="diamond" size={18} color="#FFFFFF" />
                <Text style={styles.upgradeBtnText}>Nâng cấp Premium</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Usage Stats */}
          <Animated.View entering={FadeInUp.delay(100).duration(DURATION.normal)}>
            <Text style={[styles.sectionTitle, { color: theme.text.muted }]}>
              SỬ DỤNG HÔM NAY
            </Text>
            <View style={[styles.usageCard, { backgroundColor: theme.bg.surface }]}>
              <View style={styles.usageRow}>
                <View style={styles.usageItem}>
                  <View style={[styles.usageIcon, { backgroundColor: theme.semantic.like.light }]}>
                    <MaterialCommunityIcons
                      name="cards-heart"
                      size={22}
                      color={theme.semantic.like.main}
                    />
                  </View>
                  <Text style={[styles.usageValue, { color: theme.text.primary }]}>
                    {usage?.swipesRemaining === -1 ? '∞' : usage?.swipesRemaining ?? 0}
                  </Text>
                  <Text style={[styles.usageLabel, { color: theme.text.muted }]}>
                    Swipes còn lại
                  </Text>
                </View>

                <View style={[styles.usageDivider, { backgroundColor: theme.border.subtle }]} />

                <View style={styles.usageItem}>
                  <View style={[styles.usageIcon, { backgroundColor: '#FEF3C7' }]}>
                    <MaterialCommunityIcons name="star" size={22} color="#F59E0B" />
                  </View>
                  <Text style={[styles.usageValue, { color: theme.text.primary }]}>
                    {usage?.superLikesRemaining ?? 0}
                  </Text>
                  <Text style={[styles.usageLabel, { color: theme.text.muted }]}>
                    Super Likes
                  </Text>
                </View>
              </View>

              <View style={[styles.usageNote, { backgroundColor: theme.bg.base }]}>
                <Ionicons name="refresh" size={14} color={theme.text.muted} />
                <Text style={[styles.usageNoteText, { color: theme.text.muted }]}>
                  Reset lúc 00:00 mỗi ngày
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Premium Features */}
          <Animated.View entering={FadeInUp.delay(150).duration(DURATION.normal)}>
            <Text style={[styles.sectionTitle, { color: theme.text.muted }]}>
              QUYỀN LỢI PREMIUM
            </Text>
            <View style={[styles.featuresCard, { backgroundColor: theme.bg.surface }]}>
              {[
                { icon: 'infinite', text: 'Swipe không giới hạn', active: isPremium },
                { icon: 'heart', text: 'Xem ai đã thích bạn', active: isPremium },
                { icon: 'star', text: '5 Super Likes mỗi ngày', active: isPremium },
                { icon: 'refresh', text: 'Quay lại người đã swipe', active: isPremium },
                { icon: 'eye', text: 'Xem profile rõ ràng', active: isPremium },
                { icon: 'flash', text: 'Ưu tiên hiển thị', active: isPremium },
              ].map((feature, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.featureRow,
                    idx < 5 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border.subtle }
                  ]}
                >
                  <View style={[
                    styles.featureIcon,
                    { backgroundColor: feature.active ? theme.brand.primaryMuted : theme.bg.elevated }
                  ]}>
                    <Ionicons
                      name={feature.icon as any}
                      size={18}
                      color={feature.active ? theme.brand.primary : theme.text.muted}
                    />
                  </View>
                  <Text style={[
                    styles.featureText,
                    { color: feature.active ? theme.text.primary : theme.text.muted }
                  ]}>
                    {feature.text}
                  </Text>
                  <Ionicons
                    name={feature.active ? 'checkmark-circle' : 'lock-closed'}
                    size={20}
                    color={feature.active ? '#10B981' : theme.text.muted}
                  />
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Transaction History */}
          <Animated.View entering={FadeInUp.delay(200).duration(DURATION.normal)}>
            <Text style={[styles.sectionTitle, { color: theme.text.muted }]}>
              LỊCH SỬ GIAO DỊCH
            </Text>
            {txnLoading ? (
              <ActivityIndicator size="small" color={theme.brand.primary} />
            ) : transactions.length > 0 ? (
              <View style={styles.txnList}>
                {transactions.map((txn, index) => renderTransaction({ item: txn, index }))}
              </View>
            ) : (
              <View style={[styles.emptyTxn, { backgroundColor: theme.bg.surface }]}>
                <Ionicons name="receipt-outline" size={32} color={theme.text.muted} />
                <Text style={[styles.emptyTxnText, { color: theme.text.muted }]}>
                  Chưa có giao dịch nào
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Extend Subscription Button (for premium users) */}
          {isPremium && (
            <Animated.View entering={FadeInUp.delay(250).duration(DURATION.normal)}>
              <TouchableOpacity
                style={[styles.extendBtn, { backgroundColor: theme.brand.primary }]}
                onPress={handleUpgrade}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.extendBtnText}>Gia hạn Premium</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export const DatingSubscriptionScreen: React.FC = () => {
  return (
    <DatingThemeProvider>
      <SubscriptionInner />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...TEXT_STYLES.headingMedium,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Section title
  sectionTitle: {
    ...TEXT_STYLES.labelSmall,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },

  // Status Card
  statusCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  statusTier: {
    ...TEXT_STYLES.headingMedium,
  },
  statusDesc: {
    ...TEXT_STYLES.bodySmall,
    marginTop: 2,
  },
  expiryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    gap: SPACING.xs,
  },
  expiryText: {
    ...TEXT_STYLES.bodySmall,
    color: 'rgba(255,255,255,0.9)',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  upgradeBtnText: {
    ...TEXT_STYLES.labelMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Usage Card
  usageCard: {
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  usageRow: {
    flexDirection: 'row',
    padding: SPACING.lg,
  },
  usageItem: {
    flex: 1,
    alignItems: 'center',
  },
  usageIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  usageValue: {
    ...TEXT_STYLES.headingLarge,
  },
  usageLabel: {
    ...TEXT_STYLES.labelSmall,
    marginTop: 2,
  },
  usageDivider: {
    width: 1,
    marginVertical: SPACING.sm,
  },
  usageNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  usageNoteText: {
    ...TEXT_STYLES.tiny,
  },

  // Features Card
  featuresCard: {
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  featureText: {
    flex: 1,
    ...TEXT_STYLES.bodyMedium,
  },

  // Transaction list
  txnList: {
    marginHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  txnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txnIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  txnInfo: {},
  txnPlan: {
    ...TEXT_STYLES.labelMedium,
  },
  txnDate: {
    ...TEXT_STYLES.tiny,
    marginTop: 2,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    ...TEXT_STYLES.labelMedium,
    fontWeight: '600',
  },
  txnStatusBadge: {
    marginTop: 4,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  txnStatusText: {
    ...TEXT_STYLES.tiny,
    fontWeight: '600',
  },
  emptyTxn: {
    marginHorizontal: SPACING.md,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyTxnText: {
    ...TEXT_STYLES.bodySmall,
  },

  // Extend button
  extendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  extendBtnText: {
    ...TEXT_STYLES.labelMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default DatingSubscriptionScreen;
