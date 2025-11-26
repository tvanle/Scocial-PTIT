import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Button, Input, Divider } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Strings } from '../../constants/strings';
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
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterData, string>>>({});
  const [agreeTerms, setAgreeTerms] = useState(false);

  const { register, isLoading, error } = useAuthStore();

  const updateField = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterData, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = Strings.errors.requiredField;
    }

    if (!formData.email.trim()) {
      newErrors.email = Strings.errors.requiredField;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = Strings.errors.invalidEmail;
    }

    if (!formData.password) {
      newErrors.password = Strings.errors.requiredField;
    } else if (formData.password.length < 6) {
      newErrors.password = Strings.errors.invalidPassword;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = Strings.errors.requiredField;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = Strings.errors.passwordNotMatch;
    }

    if (formData.studentId && !/^[BDN]\d{8}$/.test(formData.studentId.toUpperCase())) {
      newErrors.studentId = Strings.errors.invalidStudentId;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    if (!agreeTerms) {
      alert('Vui lòng đồng ý với điều khoản sử dụng');
      return;
    }

    try {
      await register(formData);
      navigation.navigate('VerifyEmail', { email: formData.email });
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientEnd]}
                style={styles.logoContainer}
              >
                <Text style={styles.logoText}>PTIT</Text>
              </LinearGradient>
              <Text style={styles.title}>{Strings.auth.createAccount}</Text>
              <Text style={styles.subtitle}>
                Tham gia cộng đồng sinh viên PTIT ngay hôm nay
              </Text>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <Input
              label={Strings.auth.fullName}
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChangeText={(value) => updateField('fullName', value)}
              leftIcon="person-outline"
              error={errors.fullName}
              required
            />

            <Input
              label={Strings.auth.email}
              placeholder="example@ptit.edu.vn"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              error={errors.email}
              required
            />

            <Input
              label={Strings.auth.studentId}
              placeholder="B21DCCN001"
              value={formData.studentId}
              onChangeText={(value) => updateField('studentId', value.toUpperCase())}
              autoCapitalize="characters"
              leftIcon="card-outline"
              error={errors.studentId}
              hint="Mã sinh viên bắt đầu bằng B, D hoặc N"
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{Strings.auth.faculty}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.faculty}
                  onValueChange={(value) => updateField('faculty', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Chọn khoa" value="" />
                  {Strings.ptit.faculties.map((faculty) => (
                    <Picker.Item key={faculty} label={faculty} value={faculty} />
                  ))}
                </Picker>
              </View>
            </View>

            <Input
              label={Strings.auth.class}
              placeholder="D21CQCN01-B"
              value={formData.className}
              onChangeText={(value) => updateField('className', value.toUpperCase())}
              autoCapitalize="characters"
              leftIcon="school-outline"
            />

            <Input
              label={Strings.auth.phone}
              placeholder="0912345678"
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />

            <Input
              label={Strings.auth.password}
              placeholder="••••••••"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              secureTextEntry
              leftIcon="lock-closed-outline"
              error={errors.password}
              required
            />

            <Input
              label={Strings.auth.confirmPassword}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              secureTextEntry
              leftIcon="lock-closed-outline"
              error={errors.confirmPassword}
              required
            />

            {/* Terms */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreeTerms(!agreeTerms)}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Ionicons name="checkmark" size={14} color={Colors.textLight} />}
              </View>
              <Text style={styles.termsText}>
                Tôi đồng ý với{' '}
                <Text style={styles.termsLink}>Điều khoản sử dụng</Text>
                {' '}và{' '}
                <Text style={styles.termsLink}>Chính sách bảo mật</Text>
              </Text>
            </TouchableOpacity>

            {/* Register Button */}
            <Button
              title={Strings.auth.register}
              onPress={handleRegister}
              variant="gradient"
              fullWidth
              loading={isLoading}
              disabled={!agreeTerms}
              style={styles.registerButton}
            />
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{Strings.auth.hasAccount}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>{Strings.auth.loginNow}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.md,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textLight,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  registerButton: {
    marginTop: Spacing.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  loginText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.semiBold,
    marginLeft: Spacing.xs,
  },
});

export default RegisterScreen;
