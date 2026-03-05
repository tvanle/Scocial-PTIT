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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout, Shadow } from '../../constants/theme';

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [emailOrStudentId, setEmailOrStudentId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const validate = (): boolean => {
    if (!emailOrStudentId.trim()) {
      setError('Vui lòng nhập email hoặc mã sinh viên');
      return false;
    }
    setError('');
    return true;
  };

  const handleSendCode = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSent(true);
    } catch (err) {
      setError('Thông tin không chính xác');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="mail" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.successTitle}>Kiểm tra email</Text>
            <Text style={styles.successText}>
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{'\n'}
              <Text style={styles.emailHighlight}>{emailOrStudentId}</Text>
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
                <Text style={styles.resendLink}>Gửi lại mã</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="arrow-back" size={16} color={Colors.primary} />
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
          <View style={styles.headerSection}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>
              Nhập email hoặc mã sinh viên để đặt lại mật khẩu.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email hoặc Mã sinh viên</Text>
              <View style={[styles.inputContainer, error && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="vd. B21DCCN001"
                  placeholderTextColor={Colors.gray400}
                  value={emailOrStudentId}
                  onChangeText={(text) => {
                    setEmailOrStudentId(text);
                    if (error) setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Ionicons name="person-outline" size={20} color={Colors.gray400} />
              </View>
              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
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
                <View style={styles.sendButtonContent}>
                  <Text style={styles.sendButtonText}>Gửi liên kết đặt lại</Text>
                  <Ionicons name="send" size={16} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.primary} />
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
  headerSection: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
    marginBottom: Spacing.xxxl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.lg,
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
  sendButton: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.red,
  },
  sendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
    gap: Spacing.sm,
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
