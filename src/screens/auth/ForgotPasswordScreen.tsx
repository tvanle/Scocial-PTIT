import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout, Shadow } from '../../constants/theme';
import { Strings } from '../../constants/strings';

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setError(Strings.errors.requiredField);
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(Strings.errors.invalidEmail);
      return false;
    }
    setError('');
    return true;
  };

  const handleSendCode = async () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSent(true);
    } catch (err) {
      setError(Strings.errors.serverError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (err) {
      setError(Strings.errors.serverError);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="mail" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.successTitle}>Kiểm tra email</Text>
            <Text style={styles.successText}>
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            <TouchableOpacity
              style={styles.openEmailButton}
              onPress={() => Linking.openURL('mailto:')}
              activeOpacity={0.8}
            >
              <Text style={styles.openEmailText}>Mở ứng dụng Email</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResendCode} disabled={isLoading}>
              <Text style={styles.resendText}>
                Không nhận được email?{' '}
                <Text style={styles.resendLink}>{Strings.auth.resendCode}</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="arrow-back" size={18} color={Colors.primary} />
              <Text style={styles.backToLoginText}>Quay lại đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Quên mật khẩu?</Text>
            <Text style={styles.subtitle}>
              Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <View style={[styles.inputContainer, error && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="example@ptit.edu.vn"
                  placeholderTextColor={Colors.gray400}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendCode}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.sendButtonText}>Gửi liên kết đặt lại</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="arrow-back" size={18} color={Colors.primary} />
            <Text style={styles.backToLoginText}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    padding: Spacing.xxl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  inputWrapper: {
    marginBottom: Spacing.lg,
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
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.lg,
  },
  sendButton: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.red,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  backToLoginText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.semiBold,
  },
  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  successTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  successText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  emailHighlight: {
    color: Colors.primary,
    fontWeight: FontWeight.semiBold,
  },
  openEmailButton: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: Spacing.xl,
    ...Shadow.red,
  },
  openEmailText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  resendText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  resendLink: {
    color: Colors.primary,
    fontWeight: FontWeight.semiBold,
  },
});

export default ForgotPasswordScreen;
