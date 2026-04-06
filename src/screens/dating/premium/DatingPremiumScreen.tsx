/**
 * Dating Premium Screen
 * Shows subscription info, pricing plans, and handles upgrade
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';

import { useDatingTheme } from '../../../contexts/DatingThemeContext';
import { SPACING, RADIUS } from '../../../constants/dating/design-system';
import datingPaymentService, {
  PricingPlan,
  SubscriptionInfo,
  UsageInfo,
} from '../../../services/dating/datingPaymentService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PREMIUM_FEATURES = [
  { icon: 'infinite', text: 'Swipe không giới hạn' },
  { icon: 'heart', text: 'Xem ai đã thích bạn' },
  { icon: 'star', text: '5 Super Likes mỗi ngày' },
  { icon: 'refresh', text: 'Quay lại người đã swipe' },
  { icon: 'eye', text: 'Xem profile rõ ràng' },
  { icon: 'flash', text: 'Ưu tiên hiển thị' },
];

export const DatingPremiumScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useDatingTheme();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [qrData, setQrData] = useState<{
    qrUrl: string;
    bankId: string;
    accountNo: string;
    accountName: string;
    amount: number;
    transferInfo: string;
    transactionCode: string;
  } | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [subInfo, plansData] = await Promise.all([
          datingPaymentService.getSubscriptionInfo(),
          datingPaymentService.getPricingPlans(),
        ]);

        setSubscription(subInfo.subscription);
        setUsage(subInfo.usage);
        setPlans(plansData.plans);

        // Pre-select quarterly plan (best value)
        const quarterly = plansData.plans.find(p => p.type === 'QUARTERLY');
        setSelectedPlan(quarterly || plansData.plans[0]);
      } catch (error) {
        console.error('Failed to load subscription data:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin gói dịch vụ');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle purchase - show VietQR code modal
  const handlePurchase = useCallback(async () => {
    if (!selectedPlan) return;

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await datingPaymentService.createVietQRPayment(selectedPlan.type);
      setQrData(result.qrData);
      setTransactionId(result.transactionId);
      setQrModalVisible(true);
    } catch (error) {
      console.error('Failed to create payment:', error);
      Alert.alert('Lỗi', 'Không thể tạo mã thanh toán. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedPlan]);

  // Close QR modal and stop polling
  const handleCloseQrModal = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setQrModalVisible(false);
    setQrData(null);
    setTransactionId(null);
  }, []);

  // Verify payment via SePay API
  const verifyPayment = useCallback(async () => {
    if (!transactionId) return;

    try {
      const result = await datingPaymentService.verifyPayment(transactionId);

      if (result.status === 'SUCCESS') {
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        setQrModalVisible(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessModalVisible(true);
      }
      // Don't show anything for PENDING - just keep polling silently
    } catch (error) {
      console.error('Failed to verify payment:', error);
      // Don't show error to user - just keep polling
    }
  }, [transactionId]);

  // Start polling when QR modal opens
  useEffect(() => {
    if (qrModalVisible && transactionId) {
      // Initial check after 5 seconds
      const initialTimeout = setTimeout(() => {
        verifyPayment();
      }, 5000);

      // Then poll every 3 seconds
      pollingRef.current = setInterval(() => {
        verifyPayment();
      }, 3000);

      return () => {
        clearTimeout(initialTimeout);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [qrModalVisible, transactionId, verifyPayment]);

  // Manual verify button
  const handleManualVerify = useCallback(async () => {
    if (!transactionId) return;
    setVerifying(true);
    await verifyPayment();
    setVerifying(false);
  }, [transactionId, verifyPayment]);

  // Handle back
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator size="large" color={theme.brand.primary} />
        </SafeAreaView>
      </View>
    );
  }

  const isPremium = subscription?.tier === 'PREMIUM' && subscription?.status === 'ACTIVE';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="close" size={28} color={theme.text.primary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            Premium
          </Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Premium Badge */}
          <View style={[styles.premiumBadge, { backgroundColor: theme.brand.primary }]}>
            <Ionicons name="diamond" size={48} color="#FFFFFF" />
            <Text style={styles.premiumTitle}>PTIT Premium</Text>
            <Text style={styles.premiumSubtitle}>
              {isPremium
                ? `Còn ${subscription?.daysRemaining} ngày`
                : 'Nâng cấp trải nghiệm hẹn hò'}
            </Text>
          </View>

          {/* Current Status */}
          {usage && (
            <View style={[styles.statusCard, { backgroundColor: theme.bg.surface }]}>
              <Text style={[styles.statusTitle, { color: theme.text.primary }]}>
                Hôm nay
              </Text>
              <View style={styles.statusRow}>
                <View style={styles.statusItem}>
                  <Text style={[styles.statusValue, { color: theme.brand.primary }]}>
                    {usage.swipesRemaining === -1 ? '∞' : usage.swipesRemaining}
                  </Text>
                  <Text style={[styles.statusLabel, { color: theme.text.muted }]}>
                    Swipes còn lại
                  </Text>
                </View>
                <View style={[styles.statusDivider, { backgroundColor: theme.border.subtle }]} />
                <View style={styles.statusItem}>
                  <Text style={[styles.statusValue, { color: '#FFD700' }]}>
                    {usage.superLikesRemaining}
                  </Text>
                  <Text style={[styles.statusLabel, { color: theme.text.muted }]}>
                    Super Likes
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Tính năng Premium
            </Text>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: theme.brand.primary + '20' }]}>
                  <Ionicons
                    name={feature.icon as any}
                    size={20}
                    color={theme.brand.primary}
                  />
                </View>
                <Text style={[styles.featureText, { color: theme.text.primary }]}>
                  {feature.text}
                </Text>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.brand.primary}
                />
              </View>
            ))}
          </View>

          {/* Pricing Plans */}
          {!isPremium && (
            <View style={styles.plansSection}>
              <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
                Chọn gói
              </Text>
              {plans.map((plan) => {
                const isSelected = selectedPlan?.type === plan.type;
                return (
                  <Pressable
                    key={plan.type}
                    style={[
                      styles.planCard,
                      { borderColor: isSelected ? theme.brand.primary : theme.border.subtle },
                      isSelected && { backgroundColor: theme.brand.primary + '10' },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedPlan(plan);
                    }}
                  >
                    {plan.savings && (
                      <View style={[styles.savingsBadge, { backgroundColor: theme.brand.primary }]}>
                        <Text style={styles.savingsText}>-{plan.savings}</Text>
                      </View>
                    )}
                    <View style={styles.planInfo}>
                      <Text style={[styles.planLabel, { color: theme.text.primary }]}>
                        {plan.label}
                      </Text>
                      <Text style={[styles.planDesc, { color: theme.text.muted }]}>
                        {plan.description}
                      </Text>
                    </View>
                    <View style={styles.planPricing}>
                      <Text style={[styles.planPrice, { color: theme.text.primary }]}>
                        {plan.formattedPrice}
                      </Text>
                      <Text style={[styles.planMonthly, { color: theme.text.muted }]}>
                        {plan.monthlyPrice}/tháng
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        { borderColor: isSelected ? theme.brand.primary : theme.border.subtle },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[styles.radioInner, { backgroundColor: theme.brand.primary }]}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        {!isPremium && (
          <View style={[styles.bottomCta, { backgroundColor: theme.bg.base }]}>
            <Pressable
              style={[
                styles.purchaseButton,
                { backgroundColor: theme.brand.primary },
                submitting && styles.buttonDisabled,
              ]}
              onPress={handlePurchase}
              disabled={submitting || !selectedPlan}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="diamond" size={20} color="#FFFFFF" />
                  <Text style={styles.purchaseText}>
                    Nâng cấp ngay - {selectedPlan?.formattedPrice}
                  </Text>
                </>
              )}
            </Pressable>
            <Text style={[styles.disclaimer, { color: theme.text.muted }]}>
              Thanh toán qua VNPay. Hủy bất cứ lúc nào.
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          // Invalidate subscription queries to refresh premium status everywhere
          queryClient.invalidateQueries({ queryKey: ['dating', 'subscription'] });
          setSuccessModalVisible(false);
          navigation.goBack();
        }}
      >
        <View style={styles.successModalOverlay}>
          <View style={[styles.successModalContent, { backgroundColor: theme.bg.surface }]}>
            <View style={[styles.successIconCircle, { backgroundColor: '#10B981' }]}>
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
            <Text style={[styles.successTitle, { color: theme.text.primary }]}>
              Chúc mừng!
            </Text>
            <Text style={[styles.successSubtitle, { color: theme.text.muted }]}>
              Bạn đã nâng cấp lên Premium thành công
            </Text>
            <View style={[styles.successFeaturesList, { backgroundColor: theme.bg.base }]}>
              <View style={styles.successFeatureItem}>
                <Ionicons name="infinite" size={20} color={theme.brand.primary} />
                <Text style={[styles.successFeatureText, { color: theme.text.primary }]}>
                  Swipe không giới hạn
                </Text>
              </View>
              <View style={styles.successFeatureItem}>
                <Ionicons name="heart" size={20} color={theme.brand.primary} />
                <Text style={[styles.successFeatureText, { color: theme.text.primary }]}>
                  Xem ai đã thích bạn
                </Text>
              </View>
              <View style={styles.successFeatureItem}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={[styles.successFeatureText, { color: theme.text.primary }]}>
                  5 Super Likes mỗi ngày
                </Text>
              </View>
              <View style={styles.successFeatureItem}>
                <Ionicons name="refresh" size={20} color={theme.brand.primary} />
                <Text style={[styles.successFeatureText, { color: theme.text.primary }]}>
                  Quay lại người đã swipe
                </Text>
              </View>
            </View>
            <Pressable
              style={[styles.successButton, { backgroundColor: theme.brand.primary }]}
              onPress={() => {
                // Invalidate subscription queries to refresh premium status everywhere
                queryClient.invalidateQueries({ queryKey: ['dating', 'subscription'] });
                setSuccessModalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.successButtonText}>Bắt đầu khám phá</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseQrModal}
      >
        <View style={[styles.qrModalContainer, { backgroundColor: theme.bg.base }]}>
          <SafeAreaView style={styles.qrModalSafeArea}>
            {/* Modal Header */}
            <View style={styles.qrModalHeader}>
              <Pressable onPress={handleCloseQrModal} style={styles.qrCloseButton}>
                <Ionicons name="close" size={28} color={theme.text.primary} />
              </Pressable>
              <Text style={[styles.qrModalTitle, { color: theme.text.primary }]}>
                Quét mã thanh toán
              </Text>
              <View style={styles.qrCloseButton} />
            </View>

            {/* QR Content */}
            <ScrollView
              style={styles.qrScrollContent}
              contentContainerStyle={styles.qrScrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.qrWrapper, { backgroundColor: '#FFFFFF' }]}>
                {qrData && (
                  <Image
                    source={{ uri: qrData.qrUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                )}
              </View>

              <Text style={[styles.qrInstruction, { color: theme.text.primary }]}>
                Quét mã bằng app ngân hàng
              </Text>
              <Text style={[styles.qrSubInstruction, { color: theme.text.muted }]}>
                Hỗ trợ tất cả ngân hàng Việt Nam
              </Text>

              {/* Bank info */}
              {qrData && (
                <View style={[styles.bankInfoBox, { backgroundColor: theme.bg.surface }]}>
                  <View style={styles.bankInfoRow}>
                    <Text style={[styles.bankInfoLabel, { color: theme.text.muted }]}>Ngân hàng</Text>
                    <Text style={[styles.bankInfoValue, { color: theme.text.primary }]}>{qrData.bankId}</Text>
                  </View>
                  <View style={styles.bankInfoRow}>
                    <Text style={[styles.bankInfoLabel, { color: theme.text.muted }]}>Số tài khoản</Text>
                    <Text style={[styles.bankInfoValue, { color: theme.text.primary }]}>{qrData.accountNo}</Text>
                  </View>
                  <View style={styles.bankInfoRow}>
                    <Text style={[styles.bankInfoLabel, { color: theme.text.muted }]}>Chủ tài khoản</Text>
                    <Text style={[styles.bankInfoValue, { color: theme.text.primary }]}>{qrData.accountName}</Text>
                  </View>
                  <View style={styles.bankInfoRow}>
                    <Text style={[styles.bankInfoLabel, { color: theme.text.muted }]}>Số tiền</Text>
                    <Text style={[styles.bankInfoValue, { color: theme.brand.primary, fontWeight: '700' }]}>
                      {selectedPlan?.formattedPrice}
                    </Text>
                  </View>
                  <View style={styles.bankInfoRow}>
                    <Text style={[styles.bankInfoLabel, { color: theme.text.muted }]}>Nội dung CK</Text>
                    <Text style={[styles.bankInfoValue, { color: theme.brand.primary }]}>{qrData.transferInfo}</Text>
                  </View>
                </View>
              )}

              <Text style={[styles.qrNote, { color: theme.text.muted }]}>
                Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống tự động xác nhận
              </Text>

              {/* Polling indicator - no text, just silent spinner */}
              <View style={styles.pollingStatus}>
                <ActivityIndicator size="small" color={theme.brand.primary} />
              </View>
            </ScrollView>

            {/* Bottom buttons */}
            <View style={styles.qrBottomButtons}>
              <Pressable
                style={[
                  styles.qrCheckButton,
                  { backgroundColor: theme.brand.primary },
                  verifying && styles.buttonDisabled
                ]}
                onPress={handleManualVerify}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={20} color="#FFFFFF" />
                    <Text style={styles.qrCheckButtonText}>Kiểm tra ngay</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                style={[styles.qrCancelButton, { borderColor: theme.border.subtle }]}
                onPress={handleCloseQrModal}
              >
                <Text style={[styles.qrCancelButtonText, { color: theme.text.muted }]}>
                  Hủy
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  premiumBadge: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingVertical: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  premiumTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  premiumSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  statusCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  statusLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statusDivider: {
    width: 1,
    height: 40,
  },
  featuresSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    marginLeft: SPACING.sm,
  },
  plansSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    marginBottom: SPACING.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  savingsBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderBottomLeftRadius: RADIUS.sm,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  planDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  planPricing: {
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  planMonthly: {
    fontSize: 11,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  purchaseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  // QR Modal Styles
  qrModalContainer: {
    flex: 1,
  },
  qrModalSafeArea: {
    flex: 1,
  },
  qrModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  qrCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  qrScrollContent: {
    flex: 1,
  },
  qrScrollContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  qrWrapper: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  qrImage: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
  },
  qrInstruction: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: SPACING.xl,
    textAlign: 'center',
  },
  qrSubInstruction: {
    fontSize: 14,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  bankInfoBox: {
    width: '100%',
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  bankInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  bankInfoLabel: {
    fontSize: 13,
  },
  bankInfoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  qrNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    lineHeight: 18,
  },
  pollingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  pollingText: {
    fontSize: 14,
  },
  qrAmountBox: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  qrAmountLabel: {
    fontSize: 13,
  },
  qrAmount: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  qrBottomButtons: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  qrCheckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  qrCheckButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  qrCancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  qrCancelButtonText: {
    fontSize: 16,
  },

  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  successModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  successFeaturesList: {
    width: '100%',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  successFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  successFeatureText: {
    fontSize: 14,
    fontWeight: '500',
  },
  successButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DatingPremiumScreen;
