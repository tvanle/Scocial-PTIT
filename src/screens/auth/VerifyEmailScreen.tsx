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
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { AuthStackParamList } from '../../types';
import { authService } from '../../services/auth/authService';
import { showAlert } from '../../utils/alert';

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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Xac thuc email</Text>
          <View style={styles.headerRight} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            {/* Card */}
            <View style={styles.card}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.iconBg}>
                  <Ionicons name="mail-open" size={36} color={Colors.primary} />
                </View>
                <View style={styles.iconBadge}>
                  <Ionicons name="notifications" size={14} color={Colors.white} />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.title}>Kiem tra email</Text>
              <Text style={styles.subtitle}>
                Chung toi da gui ma xac thuc 6 so den{'\n'}
                <Text style={styles.email}>{email}</Text>
              </Text>

              {/* OTP Input */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled,
                      error && styles.otpInputError,
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
                  <Ionicons name="alert-circle" size={14} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.button, (!isComplete || loading) && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={loading || !isComplete}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Xac thuc</Text>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                  </>
                )}
              </TouchableOpacity>

              {/* Resend */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Khong nhan duoc ma? </Text>
                {countdown > 0 ? (
                  <View style={styles.countdownBox}>
                    <Ionicons name="time" size={14} color={Colors.gray400} />
                    <Text style={styles.countdownText}>{countdown}s</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={resending}>
                    {resending ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Text style={styles.resendLink}>Gui lai</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Help */}
            <View style={styles.helpCard}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={styles.helpText}>
                Kiem tra thu muc <Text style={styles.helpBold}>Spam</Text> neu ban khong thay email trong hop thu den
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
    backgroundColor: Colors.gray50,
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 42,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.white,
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
    backgroundColor: 'rgba(196, 30, 58, 0.1)',
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  email: {
    color: Colors.primary,
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
    borderColor: Colors.gray200,
    backgroundColor: Colors.gray50,
    fontSize: 22,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  otpInputError: {
    borderColor: Colors.error,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
  },
  button: {
    flexDirection: 'row',
    width: '100%',
    height: 54,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray300,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  countdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countdownText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    fontWeight: FontWeight.semiBold,
  },
  resendLink: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 30, 58, 0.05)',
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(196, 30, 58, 0.1)',
  },
  helpText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  helpBold: {
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
});

export default VerifyEmailScreen;
