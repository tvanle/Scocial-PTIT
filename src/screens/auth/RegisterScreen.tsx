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
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { authService } from '../../services/auth/authService';
import { RegisterData } from '../../types';
import { useTheme } from '../../hooks/useThemeColors';

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
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { colors, isDark } = useTheme();

  const updateField = (field: keyof RegisterData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui long nhap ho va ten';
    if (!formData.studentId?.trim()) newErrors.studentId = 'Vui long nhap ma sinh vien';
    if (!formData.email.trim()) newErrors.email = 'Vui long nhap email';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email khong hop le';
    if (!formData.password) newErrors.password = 'Vui long nhap mat khau';
    else if (formData.password.length < 6) newErrors.password = 'Mat khau phai co it nhat 6 ky tu';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mat khau khong khop';
    if (!agreeTerms) newErrors.terms = 'Ban can dong y dieu khoan su dung';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setApiError(null);
    try {
      await authService.register(formData);
      navigation.navigate('VerifyEmail', { email: formData.email });
    } catch (err: any) {
      setApiError(err.message || 'Dang ky that bai');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    field: keyof RegisterData,
    label: string,
    icon: string,
    placeholder: string,
    options?: { secure?: boolean; keyboard?: any; capitalize?: any }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label} <Text style={[styles.required, { color: colors.error }]}>*</Text></Text>
      <View style={[
        styles.inputWrapper,
        { backgroundColor: colors.inputBackground, borderColor: colors.gray200 },
        focusedField === field && { borderColor: colors.primary, backgroundColor: colors.cardBackground },
        errors[field] && { borderColor: colors.error }
      ]}>
        <View style={[
          styles.inputIcon,
          { backgroundColor: colors.gray100 },
          focusedField === field && { backgroundColor: colors.primaryLight }
        ]}>
          <Ionicons name={icon as any} size={18} color={focusedField === field ? colors.primary : colors.gray400} />
        </View>
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder={placeholder}
          placeholderTextColor={colors.gray400}
          value={formData[field]}
          onChangeText={(text) => updateField(field, text)}
          secureTextEntry={options?.secure && !showPassword}
          keyboardType={options?.keyboard}
          autoCapitalize={options?.capitalize || 'none'}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
        />
        {options?.secure && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.gray400} />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{errors[field]}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.gray100 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Tao tai khoan</Text>
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, styles.stepDotActive, { backgroundColor: colors.primary }]} />
              <View style={[styles.stepLine, { backgroundColor: colors.gray200 }]} />
              <View style={[styles.stepDot, { backgroundColor: colors.gray300 }]} />
            </View>
          </View>
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
            {/* Welcome Card */}
            <View style={[styles.welcomeCard, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.welcomeIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="person-add" size={24} color={colors.primary} />
              </View>
              <View style={styles.welcomeText}>
                <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>Chao mung ban!</Text>
                <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>Dien thong tin de tham gia cong dong PTIT</Text>
              </View>
            </View>

            {/* Form */}
            <View style={[styles.form, { backgroundColor: colors.cardBackground }]}>
              {renderInput('fullName', 'Ho va ten', 'person', 'Nguyen Van A', { capitalize: 'words' })}
              {renderInput('studentId', 'Ma sinh vien', 'card', 'B21DCCN001', { capitalize: 'characters' })}
              {renderInput('email', 'Email', 'mail', 'email@example.com', { keyboard: 'email-address' })}
              {renderInput('password', 'Mat khau', 'lock-closed', 'It nhat 6 ky tu', { secure: true })}
              {renderInput('confirmPassword', 'Xac nhan mat khau', 'lock-closed', 'Nhap lai mat khau', { secure: true })}

              {/* API Error */}
              {apiError && (
                <View style={[styles.apiError, { backgroundColor: colors.errorLight, borderColor: isDark ? colors.error : '#FECACA' }]}>
                  <Ionicons name="warning" size={20} color={colors.error} />
                  <Text style={[styles.apiErrorText, { color: colors.error }]}>{apiError}</Text>
                </View>
              )}

              {/* Terms */}
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.gray300 },
                  agreeTerms && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}>
                  {agreeTerms && <Ionicons name="checkmark" size={14} color={colors.white} />}
                </View>
                <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                  Toi dong y voi <Text style={[styles.termsLink, { color: colors.primary }]}>Dieu khoan su dung</Text> va{' '}
                  <Text style={[styles.termsLink, { color: colors.primary }]}>Chinh sach bao mat</Text>
                </Text>
              </TouchableOpacity>
              {errors.terms && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{errors.terms}</Text>
                </View>
              )}

              {/* Register Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary, shadowColor: colors.primary },
                  (!agreeTerms || isLoading) && { backgroundColor: colors.gray300, shadowOpacity: 0, elevation: 0 }
                ]}
                onPress={handleRegister}
                disabled={isLoading || !agreeTerms}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Text style={[styles.buttonText, { color: colors.white }]}>Tao tai khoan</Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.white} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.cardBackground, borderTopColor: colors.gray100 }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Da co tai khoan? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Dang nhap</Text>
          </TouchableOpacity>
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: 6,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepDotActive: {
    width: 24,
    borderRadius: 4,
  },
  stepLine: {
    width: 20,
    height: 2,
    marginHorizontal: 4,
  },
  headerRight: {
    width: 42,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  welcomeSubtitle: {
    fontSize: FontSize.sm,
  },
  form: {
    borderRadius: 20,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    marginBottom: Spacing.sm,
  },
  required: {},
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  inputIcon: {
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
  },
  eyeBtn: {
    padding: Spacing.md,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  errorText: {
    fontSize: FontSize.xs,
  },
  apiError: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  apiErrorText: {
    flex: 1,
    fontSize: FontSize.sm,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  termsText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: FontWeight.medium,
  },
  button: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: FontSize.md,
  },
  footerLink: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});

export default RegisterScreen;
