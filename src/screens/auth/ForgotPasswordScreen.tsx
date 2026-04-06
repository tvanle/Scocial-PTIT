import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { authService } from '../../services/auth/authService';
import { showAlert } from '../../utils/alert';

interface ForgotPasswordScreenProps {
  navigation: any;
}

type Step = 'email' | 'otp' | 'newPassword';

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState<Step>('email');
  const [emailOrStudentId, setEmailOrStudentId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSendCode = async () => {
    if (!emailOrStudentId.trim()) {
      setError('Vui long nhap email hoac ma sinh vien');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await authService.forgotPassword(emailOrStudentId);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Co loi xay ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Vui long nhap du 6 so');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await authService.verifyResetCode(emailOrStudentId, otpCode);
      setStep('newPassword');
    } catch (err: any) {
      setError(err.message || 'Ma OTP khong dung');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setError('Mat khau phai co it nhat 6 ky tu');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mat khau xac nhan khong khop');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await authService.resetPassword(emailOrStudentId, otp.join(''), newPassword);
      showAlert('Thanh cong', 'Mat khau da duoc dat lai', [
        { text: 'Dang nhap', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err: any) {
      setError(err.message || 'Co loi xay ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(emailOrStudentId);
      showAlert('Thanh cong', 'Ma OTP moi da duoc gui');
    } catch (err: any) {
      setError(err.message || 'Co loi xay ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'email') navigation.goBack();
    else if (step === 'otp') setStep('email');
    else setStep('otp');
  };

  const getStepIndex = () => {
    switch (step) {
      case 'email': return 0;
      case 'otp': return 1;
      case 'newPassword': return 2;
    }
  };

  const stepInfo = [
    { icon: 'mail', title: 'Nhap email', desc: 'Nhap email hoac ma sinh vien de nhan ma xac thuc' },
    { icon: 'keypad', title: 'Nhap ma OTP', desc: `Ma xac thuc da duoc gui den ${emailOrStudentId}` },
    { icon: 'lock-closed', title: 'Mat khau moi', desc: 'Tao mat khau moi cho tai khoan cua ban' },
  ];

  const currentStep = stepInfo[getStepIndex()];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Khoi phuc mat khau</Text>
          <View style={styles.headerRight} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Progress Steps */}
            <View style={styles.progressContainer}>
              {[0, 1, 2].map((i) => (
                <React.Fragment key={i}>
                  <View style={[styles.progressDot, getStepIndex() >= i && styles.progressDotActive]}>
                    {getStepIndex() > i ? (
                      <Ionicons name="checkmark" size={14} color={Colors.white} />
                    ) : (
                      <Text style={[styles.progressNum, getStepIndex() >= i && styles.progressNumActive]}>{i + 1}</Text>
                    )}
                  </View>
                  {i < 2 && <View style={[styles.progressLine, getStepIndex() > i && styles.progressLineActive]} />}
                </React.Fragment>
              ))}
            </View>

            {/* Step Card */}
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name={currentStep.icon as any} size={28} color={Colors.primary} />
              </View>
              <Text style={styles.cardTitle}>{currentStep.title}</Text>
              <Text style={styles.cardDesc}>{currentStep.desc}</Text>

              {/* Step 1: Email */}
              {step === 'email' && (
                <View style={styles.formSection}>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'email' && styles.inputFocused,
                    error && styles.inputError
                  ]}>
                    <View style={[styles.inputIcon, focusedField === 'email' && styles.inputIconActive]}>
                      <Ionicons name="person" size={18} color={focusedField === 'email' ? Colors.primary : Colors.gray400} />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Email hoac ma sinh vien"
                      placeholderTextColor={Colors.gray400}
                      value={emailOrStudentId}
                      onChangeText={(text) => {
                        setEmailOrStudentId(text);
                        if (error) setError('');
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                  {error && (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle" size={14} color={Colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.button} onPress={handleSendCode} disabled={isLoading} activeOpacity={0.8}>
                    {isLoading ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Gui ma xac thuc</Text>
                        <Ionicons name="send" size={18} color={Colors.white} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 2: OTP */}
              {step === 'otp' && (
                <View style={styles.formSection}>
                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => { otpRefs.current[index] = ref; }}
                        style={[styles.otpInput, digit && styles.otpInputFilled]}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={(e) => handleOtpKeyPress(e, index)}
                        keyboardType="number-pad"
                        maxLength={index === 0 ? 6 : 1}
                        selectTextOnFocus
                      />
                    ))}
                  </View>
                  {error && (
                    <View style={[styles.errorRow, { justifyContent: 'center' }]}>
                      <Ionicons name="alert-circle" size={14} color={Colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={isLoading} activeOpacity={0.8}>
                    {isLoading ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Xac nhan</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleResendCode} disabled={isLoading} style={styles.resendBtn}>
                    <Text style={styles.resendText}>Khong nhan duoc? <Text style={styles.resendLink}>Gui lai</Text></Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 3: New Password */}
              {step === 'newPassword' && (
                <View style={styles.formSection}>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'password' && styles.inputFocused
                  ]}>
                    <View style={[styles.inputIcon, focusedField === 'password' && styles.inputIconActive]}>
                      <Ionicons name="lock-closed" size={18} color={focusedField === 'password' ? Colors.primary : Colors.gray400} />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Mat khau moi"
                      placeholderTextColor={Colors.gray400}
                      value={newPassword}
                      onChangeText={(text) => { setNewPassword(text); if (error) setError(''); }}
                      secureTextEntry={!showPassword}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.gray400} />
                    </TouchableOpacity>
                  </View>

                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'confirmPassword' && styles.inputFocused,
                    error && styles.inputError
                  ]}>
                    <View style={[styles.inputIcon, focusedField === 'confirmPassword' && styles.inputIconActive]}>
                      <Ionicons name="lock-closed" size={18} color={focusedField === 'confirmPassword' ? Colors.primary : Colors.gray400} />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Xac nhan mat khau"
                      placeholderTextColor={Colors.gray400}
                      value={confirmPassword}
                      onChangeText={(text) => { setConfirmPassword(text); if (error) setError(''); }}
                      secureTextEntry={!showPassword}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                  {error && (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle" size={14} color={Colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={isLoading} activeOpacity={0.8}>
                    {isLoading ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Dat lai mat khau</Text>
                        <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Nho mat khau? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Dang nhap</Text>
          </TouchableOpacity>
        </View>
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
  scrollContent: {
    padding: Spacing.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  progressNum: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.gray500,
  },
  progressNumActive: {
    color: Colors.white,
  },
  progressLine: {
    width: 50,
    height: 3,
    backgroundColor: Colors.gray200,
    marginHorizontal: Spacing.xs,
    borderRadius: 2,
  },
  progressLineActive: {
    backgroundColor: Colors.primary,
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
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(196, 30, 58, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  formSection: {
    width: '100%',
    gap: Spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray100,
  },
  inputIconActive: {
    backgroundColor: 'rgba(196, 30, 58, 0.1)',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
  },
  eyeBtn: {
    padding: Spacing.md,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  otpInput: {
    width: 46,
    height: 54,
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
  button: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  resendText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  resendLink: {
    color: Colors.primary,
    fontWeight: FontWeight.semiBold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  footerText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
});

export default ForgotPasswordScreen;
