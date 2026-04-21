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
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { useTheme } from '../../hooks/useThemeColors';

interface LoginScreenProps {
  navigation: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { login, isLoading, error } = useAuthStore();
  const { colors, isDark } = useTheme();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Vui long nhap email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email khong hop le';
    }

    if (!password) {
      newErrors.password = 'Vui long nhap mat khau';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login({ email, password, rememberMe: true });
    } catch (err) {
      // Error handled by store
    }
  };

  const isFormValid = email.trim() && password;

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header Background */}
      <View style={[styles.headerBg, { backgroundColor: colors.primary }]}>
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <View style={[styles.logoBox, { backgroundColor: colors.white }]}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.brandName, { color: colors.white }]}>PTIT Social</Text>
          <Text style={styles.brandTagline}>Ket noi sinh vien PTIT</Text>
        </SafeAreaView>
      </View>

      {/* Form Card */}
      <KeyboardAvoidingView
        style={[styles.formContainer, { backgroundColor: colors.backgroundSecondary }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Dang nhap</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Chao mung ban quay tro lai!</Text>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Email</Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: colors.inputBackground, borderColor: colors.gray200 },
                focusedField === 'email' && { borderColor: colors.primary, backgroundColor: colors.cardBackground },
                errors.email && { borderColor: colors.error }
              ]}>
                <View style={[
                  styles.inputIcon,
                  { backgroundColor: colors.gray100 },
                  focusedField === 'email' && { backgroundColor: colors.primaryLight }
                ]}>
                  <Ionicons name="mail" size={18} color={focusedField === 'email' ? colors.primary : colors.gray400} />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Nhap email cua ban"
                  placeholderTextColor={colors.gray400}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.email && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>
                </View>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Mat khau</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={[styles.forgotLink, { color: colors.primary }]}>Quen mat khau?</Text>
                </TouchableOpacity>
              </View>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: colors.inputBackground, borderColor: colors.gray200 },
                focusedField === 'password' && { borderColor: colors.primary, backgroundColor: colors.cardBackground },
                errors.password && { borderColor: colors.error }
              ]}>
                <View style={[
                  styles.inputIcon,
                  { backgroundColor: colors.gray100 },
                  focusedField === 'password' && { backgroundColor: colors.primaryLight }
                ]}>
                  <Ionicons name="lock-closed" size={18} color={focusedField === 'password' ? colors.primary : colors.gray400} />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Nhap mat khau"
                  placeholderTextColor={colors.gray400}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.gray400}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text>
                </View>
              )}
            </View>

            {/* API Error */}
            {error && (
              <View style={[styles.apiError, { backgroundColor: colors.errorLight, borderColor: isDark ? colors.error : '#FECACA' }]}>
                <Ionicons name="warning" size={20} color={colors.error} />
                <Text style={[styles.apiErrorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary, shadowColor: colors.primary },
                !isFormValid && { backgroundColor: colors.gray300, shadowOpacity: 0, elevation: 0 }
              ]}
              onPress={handleLogin}
              disabled={isLoading || !isFormValid}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Text style={[styles.buttonText, { color: colors.white }]}>Dang nhap</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.white} />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.gray200 }]} />
              <Text style={[styles.dividerText, { color: colors.gray400 }]}>hoac</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.gray200 }]} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.inputBackground, borderColor: colors.gray200 }]}>
                <Ionicons name="logo-google" size={22} color="#EA4335" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.inputBackground, borderColor: colors.gray200 }]}>
                <Ionicons name="logo-facebook" size={22} color="#1877F2" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.inputBackground, borderColor: colors.gray200 }]}>
                <Ionicons name="logo-apple" size={22} color={isDark ? colors.white : '#000'} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={[styles.footer, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Chua co tai khoan? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.footerLink, { color: colors.primary }]}>Dang ky ngay</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBg: {
    height: 220,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -60,
    right: -40,
  },
  headerDecor2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: 20,
    left: -50,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.lg,
  },
  logoBox: {
    width: 70,
    height: 70,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 45,
    height: 45,
  },
  brandName: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  card: {
    borderRadius: 20,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.md,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  forgotLink: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  inputIcon: {
    width: 46,
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
  button: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: FontSize.sm,
    marginHorizontal: Spacing.md,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  socialBtn: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  footerText: {
    fontSize: FontSize.md,
  },
  footerLink: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});

export default LoginScreen;
