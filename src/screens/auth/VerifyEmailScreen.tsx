import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontSize, FontWeight, Spacing } from '../../constants/theme';
import { AuthStackParamList } from '../../types';
import { authService } from '../../services/auth/authService';
import { showAlert } from '../../utils/alert';
import { useTheme } from '../../hooks/useThemeColors';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;
type VerifyEmailRouteProp = RouteProp<AuthStackParamList, 'VerifyEmail'>;

const OTP_LENGTH = 6;

const VerifyEmailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<VerifyEmailRouteProp>();
  const { email } = route.params;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    if (error) setError('');

    if (value.length > 1) {
      const pastedOtp = value.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedOtp.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      setError('Vui long nhap du 6 so');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.verifyEmail(email, otpCode);
      showAlert('Thanh cong', 'Xac thuc email thanh cong!', [
        { text: 'Dang nhap', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      setError(err.message || 'Ma OTP khong dung');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setResending(true);
    try {
      await authService.resendVerification(email);
      setCountdown(60);
      showAlert('Thanh cong', 'Ma OTP moi da duoc gui');
    } catch (err: any) {
      showAlert('Loi', err.message || 'Khong the gui lai ma OTP');
    } finally {
      setResending(false);
    }
  };

  const isComplete = otp.every(digit => digit !== '');

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.gray100 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Xac thuc email</Text>
          <View style={styles.headerRight} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            {/* Card */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <View style={[styles.iconBg, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="mail-open" size={36} color={colors.primary} />
                </View>
                <View style={[styles.iconBadge, { backgroundColor: colors.primary, borderColor: colors.cardBackground }]}>
                  <Ionicons name="notifications" size={14} color={colors.white} />
                </View>
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.textPrimary }]}>Kiem tra email</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Chung toi da gui ma xac thuc 6 so den{'\n'}
                <Text style={[styles.email, { color: colors.primary }]}>{email}</Text>
              </Text>

              {/* OTP Input */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      { borderColor: colors.gray200, backgroundColor: colors.inputBackground, color: colors.textPrimary },
                      digit && { borderColor: colors.primary, backgroundColor: colors.cardBackground },
                      error && { borderColor: colors.error },
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={index === 0 ? OTP_LENGTH : 1}
                    selectTextOnFocus
                  />
                ))}
              </View>
              {error && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              )}

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary, shadowColor: colors.primary },
                  (!isComplete || loading) && { backgroundColor: colors.gray300, shadowOpacity: 0, elevation: 0 }
                ]}
                onPress={handleVerify}
                disabled={loading || !isComplete}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Text style={[styles.buttonText, { color: colors.white }]}>Xac thuc</Text>
                    <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                  </>
                )}
              </TouchableOpacity>

              {/* Resend */}
              <View style={styles.resendContainer}>
                <Text style={[styles.resendText, { color: colors.textSecondary }]}>Khong nhan duoc ma? </Text>
                {countdown > 0 ? (
                  <View style={[styles.countdownBox, { backgroundColor: colors.gray100 }]}>
                    <Ionicons name="time" size={14} color={colors.gray400} />
                    <Text style={[styles.countdownText, { color: colors.gray500 }]}>{countdown}s</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={resending}>
                    {resending ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={[styles.resendLink, { color: colors.primary }]}>Gui lai</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Help */}
            <View style={[styles.helpCard, { backgroundColor: colors.primarySoft, borderColor: colors.primaryLight }]}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                Kiem tra thu muc <Text style={[styles.helpBold, { color: colors.textPrimary }]}>Spam</Text> neu ban khong thay email trong hop thu den
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  headerRight: {
    width: 42,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  card: {
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  email: {
    fontWeight: FontWeight.semiBold,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  otpInput: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 22,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.sm,
  },
  button: {
    flexDirection: 'row',
    width: '100%',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    fontSize: FontSize.md,
  },
  countdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countdownText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  resendLink: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  helpText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  helpBold: {
    fontWeight: FontWeight.semiBold,
  },
});

export default VerifyEmailScreen;
