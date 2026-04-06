/**
 * Dating Payment Result Screen
 * Handles VNPay return and shows payment result
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useDatingTheme } from '../../../contexts/DatingThemeContext';
import { SPACING, RADIUS } from '../../../constants/dating/design-system';
import datingPaymentService from '../../../services/dating/datingPaymentService';
import type { RootStackParamList } from '../../../types';

type RouteParams = RouteProp<RootStackParamList, 'DatingPaymentResult'>;

export const DatingPaymentResultScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const { theme } = useDatingTheme();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get VNPay params from route
        const vnpayParams = route.params?.vnpayParams || {};

        if (Object.keys(vnpayParams).length === 0) {
          setMessage('Không có thông tin thanh toán');
          setSuccess(false);
          setLoading(false);
          return;
        }

        const result = await datingPaymentService.verifyVNPayReturn(vnpayParams);

        setSuccess(result.success);
        setMessage(result.message);

        if (result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setSuccess(false);
        setMessage('Không thể xác minh thanh toán. Vui lòng liên hệ hỗ trợ.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [route.params]);

  const handleContinue = () => {
    if (success) {
      // Go back to discovery
      navigation.reset({
        index: 0,
        routes: [{ name: 'DatingDiscovery' }],
      });
    } else {
      // Go back to premium screen to retry
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator size="large" color={theme.brand.primary} />
          <Text style={[styles.loadingText, { color: theme.text.muted }]}>
            Đang xác minh thanh toán...
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Result Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: success ? '#4CAF50' + '20' : '#F44336' + '20' },
            ]}
          >
            <Ionicons
              name={success ? 'checkmark-circle' : 'close-circle'}
              size={80}
              color={success ? '#4CAF50' : '#F44336'}
            />
          </View>

          {/* Result Text */}
          <Text style={[styles.resultTitle, { color: theme.text.primary }]}>
            {success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </Text>
          <Text style={[styles.resultMessage, { color: theme.text.muted }]}>
            {message}
          </Text>

          {success && (
            <View style={[styles.premiumBadge, { backgroundColor: theme.brand.primary }]}>
              <Ionicons name="diamond" size={24} color="#FFFFFF" />
              <Text style={styles.premiumText}>PTIT Premium</Text>
            </View>
          )}
        </View>

        {/* CTA Button */}
        <View style={styles.bottomCta}>
          <Pressable
            style={[styles.button, { backgroundColor: theme.brand.primary }]}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>
              {success ? 'Bắt đầu khám phá' : 'Thử lại'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.lg,
    gap: SPACING.xs,
  },
  premiumText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomCta: {
    width: '100%',
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  button: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DatingPaymentResultScreen;
