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
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { RegisterData } from '../../types';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState(1);
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
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const { register, isLoading, error } = useAuthStore();

  const updateField = (field: keyof RegisterData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Nhap ten cua ban';
    if (!formData.email.trim()) newErrors.email = 'Nhap email';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email khong hop le';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.password) newErrors.password = 'Nhap mat khau';
    else if (formData.password.length < 6) newErrors.password = 'Mat khau it nhat 6 ky tu';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mat khau khong khop';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) handleRegister();
  };

  const handleRegister = async () => {
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
          onPress={() => step === 1 ? navigation.goBack() : setStep(1)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Title */}
          <Text style={styles.title}>
            {step === 1 ? 'Ten cua ban la gi?' : 'Tao mat khau'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Ban co the thay doi ten nay bat cu luc nao.'
              : 'Mat khau cua ban phai co it nhat 6 ky tu.'}
          </Text>

          {/* Step 1: Name & Email */}
          {step === 1 && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  placeholder="Ten day du"
                  placeholderTextColor={Colors.textTertiary}
                  value={formData.fullName}
                  onChangeText={(text) => updateField('fullName', text)}
                />
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Email"
                  placeholderTextColor={Colors.textTertiary}
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Ma sinh vien (khong bat buoc)"
                  placeholderTextColor={Colors.textTertiary}
                  value={formData.studentId}
                  onChangeText={(text) => updateField('studentId', text.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Mat khau"
                    placeholderTextColor={Colors.textTertiary}
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
                      color={Colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Xac nhan mat khau"
                  placeholderTextColor={Colors.textTertiary}
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateField('confirmPassword', text)}
                  secureTextEntry={!showPassword}
                />
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>
            </View>
          )}

          {error && <Text style={styles.apiError}>{error}</Text>}

          {/* Next/Register Button */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === 2 ? 'Dang ky' : 'Tiep tuc'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom */}
      <View style={styles.bottomSection}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Da co tai khoan? <Text style={styles.loginLink}>Dang nhap</Text></Text>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  form: {
    gap: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.xs,
  },
  input: {
    height: Layout.inputHeight,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  inputError: {
    borderColor: Colors.error,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.inputHeight,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  eyeButton: {
    paddingHorizontal: Spacing.lg,
    height: '100%',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  apiError: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  nextButton: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.black,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  loginText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  loginLink: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.semiBold,
  },
});

export default RegisterScreen;
