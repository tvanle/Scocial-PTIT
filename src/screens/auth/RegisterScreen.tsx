import React, { useState } from 'react';
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
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout, Shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { RegisterData } from '../../types';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    studentId: '',
    faculty: '',
    className: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const { register, isLoading, error } = useAuthStore();

  const updateField = (field: keyof RegisterData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên';
    if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email không hợp lệ. Vui lòng thử lại.';
    if (!formData.studentId?.trim()) newErrors.studentId = 'Vui lòng nhập mã sinh viên';
    if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu';
    else if (formData.password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mật khẩu không khớp. Vui lòng thử lại.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await register(formData);
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>
            Tham gia cộng đồng sinh viên PTIT ngay hôm nay.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor={Colors.gray400}
                  value={formData.fullName}
                  onChangeText={(text) => updateField('fullName', text)}
                />
              </View>
              {errors.fullName && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={Colors.error} />
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                </View>
              )}
            </View>

            {/* Student ID */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Mã sinh viên</Text>
              <View style={[styles.inputContainer, errors.studentId && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="vd. B21DCCN001"
                  placeholderTextColor={Colors.gray400}
                  value={formData.studentId}
                  onChangeText={(text) => updateField('studentId', text)}
                  autoCapitalize="characters"
                />
                <Ionicons name="school-outline" size={20} color={Colors.gray400} />
              </View>
              {errors.studentId && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={Colors.error} />
                  <Text style={styles.errorText}>{errors.studentId}</Text>
                </View>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="hello@example.com"
                  placeholderTextColor={Colors.gray400}
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.email && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={Colors.error} />
                  <Text style={styles.errorText}>{errors.email}</Text>
                </View>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.gray400}
                  value={formData.password}
                  onChangeText={(text) => updateField('password', text)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.gray400}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={Colors.error} />
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.gray400}
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateField('confirmPassword', text)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.gray400}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={Colors.error} />
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                </View>
              )}
            </View>
          </View>

          {error && (
            <View style={styles.apiErrorContainer}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.apiError}>{error}</Text>
            </View>
          )}

          {/* Terms Checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreeTerms(!agreeTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
              {agreeTerms && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            <Text style={styles.termsText}>
              Tôi đồng ý với <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{' '}
              <Text style={styles.termsLink}>Chính sách bảo mật</Text>
            </Text>
          </TouchableOpacity>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, !agreeTerms && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading || !agreeTerms}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Tạo tài khoản</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom */}
      <View style={styles.bottomSection}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>
            Đã có tài khoản? <Text style={styles.loginLink}>Đăng nhập</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
    lineHeight: 22,
  },
  form: {
    gap: Spacing.md,
  },
  inputWrapper: {},
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.inputHeight,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.gray100,
    paddingHorizontal: Spacing.lg,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  eyeButton: {
    padding: Spacing.sm,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
  },
  apiErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  apiError: {
    fontSize: FontSize.sm,
    color: Colors.error,
    flex: 1,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  registerButton: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    ...Shadow.red,
  },
  registerButtonDisabled: {
    backgroundColor: Colors.gray300,
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  loginText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});

export default RegisterScreen;
