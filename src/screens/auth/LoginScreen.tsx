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

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login, isLoading, error } = useAuthStore();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>
              Log in to see what's happening
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="hello@reallygreatsite.com"
                  placeholderTextColor={Colors.gray400}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotText}>Forgot my password</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.gray400}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
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
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Error from API */}
            {error && (
              <View style={styles.apiErrorContainer}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.apiError}>{error}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, (!email || !password) && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading || !email || !password}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Register */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerLink}>Sign Up</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.huge,
  },
  welcomeSection: {
    marginBottom: Spacing.xxxl,
  },
  welcomeTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    gap: Spacing.lg,
  },
  inputWrapper: {},
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.lg,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  apiErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  apiError: {
    fontSize: FontSize.sm,
    color: Colors.error,
    flex: 1,
  },
  loginButton: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    ...Shadow.red,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.gray300,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  registerButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  registerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  registerLink: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});

export default LoginScreen;
