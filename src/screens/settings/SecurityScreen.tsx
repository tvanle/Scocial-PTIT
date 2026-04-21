import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { FontSize, FontWeight } from '../../constants/theme';
import { useTheme } from '../../hooks/useThemeColors';
import { RootStackParamList } from '../../types';
import { authService, TwoFactorSetupResponse } from '../../services/auth/authService';
import { useAuthStore } from '../../store/slices/authSlice';
import { showAlert } from '../../utils/alert';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  valueColor?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isLast?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  subtitle,
  value,
  valueColor,
  onPress,
  rightElement,
  isLast,
  colors,
}) => (
  <TouchableOpacity
    style={[styles.row, !isLast && [styles.rowBorder, { borderBottomColor: colors.gray200 }]]}
    onPress={onPress}
    activeOpacity={onPress ? 0.6 : 1}
    disabled={!onPress}
  >
    <View style={styles.rowLeft}>
      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle && <Text style={[styles.rowSubtitle, { color: colors.gray400 }]}>{subtitle}</Text>}
    </View>
    <View style={styles.rowRight}>
      {value && (
        <Text style={[styles.rowValue, { color: colors.gray400 }, valueColor ? { color: valueColor } : undefined]}>
          {value}
        </Text>
      )}
      {rightElement}
      {onPress && !rightElement && (
        <Ionicons name="chevron-forward" size={18} color={colors.gray300} />
      )}
    </View>
  </TouchableOpacity>
);

interface SectionProps {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>['colors'];
}

const Section: React.FC<SectionProps> = ({ label, children, colors }) => (
  <View style={styles.section}>
    <View style={styles.sectionLabelContainer}>
      <Text style={[styles.sectionLabel, { color: colors.gray400 }]}>{label}</Text>
      <View style={[styles.sectionLabelLine, { backgroundColor: colors.gray200 }]} />
    </View>
    <View>{children}</View>
  </View>
);

const SecurityScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { logout } = useAuthStore();
  const { colors } = useTheme();

  // 2FA State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // Check 2FA status on mount
  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      const user = await authService.getCurrentUser();
      // Assuming user has a twoFactorEnabled field
      setIs2FAEnabled((user as any).twoFactorEnabled || false);
    } catch {
      // Silently fail
    }
  };

  const handleSetup2FA = async () => {
    setLoading(true);
    try {
      const data = await authService.setup2FA();
      setSetupData(data);
      setShow2FASetupModal(true);
    } catch (error: any) {
      showAlert('Error', error?.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (verificationCode.length !== 6) {
      showAlert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.enable2FA(verificationCode);
      setBackupCodes(result.backupCodes);
      setIs2FAEnabled(true);
      setShow2FASetupModal(false);
      setShowBackupCodes(true);
      setVerificationCode('');
      showAlert('Success', '2FA has been enabled successfully');
    } catch (error: any) {
      showAlert('Error', error?.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (verificationCode.length !== 6) {
      showAlert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await authService.disable2FA(verificationCode);
      setIs2FAEnabled(false);
      setShow2FADisableModal(false);
      setVerificationCode('');
      showAlert('Success', '2FA has been disabled');
    } catch (error: any) {
      showAlert('Error', error?.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = () => {
    showAlert(
      'Logout All Devices',
      'This will log you out from all devices including this one. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout All',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logoutAll();
              logout();
            } catch (error: any) {
              showAlert('Error', error?.response?.data?.message || 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    showAlert('Copied', 'Backup codes copied to clipboard');
  };

  const handle2FAToggle = () => {
    if (is2FAEnabled) {
      setShow2FADisableModal(true);
    } else {
      handleSetup2FA();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>

        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Security</Text>

        {/* TWO-FACTOR AUTHENTICATION */}
        <Section label="TWO-FACTOR AUTHENTICATION" colors={colors}>
          <SettingRow
            title="Enable 2FA"
            subtitle="Add an extra layer of security to your account"
            rightElement={
              <Switch
                value={is2FAEnabled}
                onValueChange={handle2FAToggle}
                trackColor={{ false: colors.gray200, true: colors.primary }}
                thumbColor={colors.white}
                disabled={loading}
              />
            }
            isLast
            colors={colors}
          />
        </Section>

        {/* SESSION MANAGEMENT */}
        <Section label="SESSION MANAGEMENT" colors={colors}>
          <SettingRow
            title="Logout All Devices"
            subtitle="End all active sessions on other devices"
            onPress={handleLogoutAll}
            isLast
            colors={colors}
          />
        </Section>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.gray50 }]}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Two-factor authentication adds an extra layer of security by requiring a code from your
            authenticator app when signing in.
          </Text>
        </View>
      </ScrollView>

      {/* 2FA Setup Modal */}
      <Modal
        visible={show2FASetupModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShow2FASetupModal(false);
          setVerificationCode('');
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.gray200 }]}>
            <TouchableOpacity
              onPress={() => {
                setShow2FASetupModal(false);
                setVerificationCode('');
              }}
            >
              <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Setup 2FA</Text>
            <TouchableOpacity onPress={handleEnable2FA} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.modalSave, { color: colors.primary }]}>Enable</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={[styles.setupStep, { color: colors.textPrimary }]}>Step 1: Scan QR Code</Text>
            <Text style={[styles.setupDescription, { color: colors.textSecondary }]}>
              Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code:
            </Text>

            {setupData?.qrCode && (
              <View style={styles.qrContainer}>
                <Image
                  source={{ uri: setupData.qrCode }}
                  style={[styles.qrCode, { backgroundColor: colors.gray50 }]}
                  resizeMode="contain"
                />
              </View>
            )}

            <Text style={[styles.setupStep, { color: colors.textPrimary }]}>Or enter this code manually:</Text>
            <TouchableOpacity
              style={[styles.secretContainer, { backgroundColor: colors.gray50 }]}
              onPress={() => setupData?.secret && copyToClipboard(setupData.secret)}
            >
              <Text style={[styles.secretCode, { color: colors.textPrimary }]}>{setupData?.secret}</Text>
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
            </TouchableOpacity>

            <Text style={[styles.setupStep, { color: colors.textPrimary }]}>Step 2: Enter Verification Code</Text>
            <Text style={[styles.setupDescription, { color: colors.textSecondary }]}>
              Enter the 6-digit code from your authenticator app:
            </Text>

            <TextInput
              style={[styles.codeInput, {
                borderColor: colors.gray200,
                color: colors.textPrimary,
                backgroundColor: colors.gray50
              }]}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="000000"
              placeholderTextColor={colors.gray300}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 2FA Disable Modal */}
      <Modal
        visible={show2FADisableModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShow2FADisableModal(false);
          setVerificationCode('');
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.gray200 }]}>
            <TouchableOpacity
              onPress={() => {
                setShow2FADisableModal(false);
                setVerificationCode('');
              }}
            >
              <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Disable 2FA</Text>
            <TouchableOpacity onPress={handleDisable2FA} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.modalSave, { color: colors.error }]}>Disable</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Ionicons
              name="warning-outline"
              size={48}
              color={colors.warning}
              style={styles.warningIcon}
            />
            <Text style={[styles.warningTitle, { color: colors.textPrimary }]}>Are you sure?</Text>
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              Disabling 2FA will make your account less secure. You will only need your password to
              sign in.
            </Text>

            <Text style={[styles.setupDescription, { color: colors.textSecondary }]}>
              Enter your current 2FA code to confirm:
            </Text>

            <TextInput
              style={[styles.codeInput, {
                borderColor: colors.gray200,
                color: colors.textPrimary,
                backgroundColor: colors.gray50
              }]}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="000000"
              placeholderTextColor={colors.gray300}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Backup Codes Modal */}
      <Modal
        visible={showBackupCodes}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBackupCodes(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.gray200 }]}>
            <View style={{ width: 60 }} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Backup Codes</Text>
            <TouchableOpacity onPress={() => setShowBackupCodes(false)}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Ionicons
              name="key-outline"
              size={48}
              color={colors.primary}
              style={styles.warningIcon}
            />
            <Text style={[styles.warningTitle, { color: colors.textPrimary }]}>Save Your Backup Codes</Text>
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              These codes can be used to access your account if you lose your phone. Each code can
              only be used once.
            </Text>

            <View style={[styles.backupCodesContainer, { backgroundColor: colors.gray50 }]}>
              {backupCodes.map((code, index) => (
                <Text key={index} style={[styles.backupCode, { color: colors.textPrimary }]}>
                  {code}
                </Text>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: colors.primary }]}
              onPress={() => copyToClipboard(backupCodes.join('\n'))}
            >
              <Ionicons name="copy-outline" size={20} color={colors.white} />
              <Text style={[styles.copyButtonText, { color: colors.white }]}>Copy All Codes</Text>
            </TouchableOpacity>

            <Text style={[styles.backupWarning, { color: colors.warning }]}>
              Store these codes in a safe place. You won't be able to see them again!
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: -4,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: FontSize.lg,
    marginLeft: 2,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: FontWeight.extraBold,
    marginTop: 4,
    marginBottom: 8,
  },
  section: {
    marginTop: 20,
  },
  sectionLabelContainer: {
    marginBottom: 0,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sectionLabelLine: {
    height: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
  },
  rowSubtitle: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValue: {
    fontSize: FontSize.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    marginTop: 32,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCancel: {
    fontSize: FontSize.lg,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
  },
  modalSave: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  setupStep: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    marginTop: 16,
    marginBottom: 8,
  },
  setupDescription: {
    fontSize: FontSize.md,
    marginBottom: 16,
    lineHeight: 22,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  qrCode: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  secretContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  secretCode: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    fontFamily: 'monospace',
    flex: 1,
  },
  codeInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    letterSpacing: 8,
  },
  warningIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  warningText: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backupCodesContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  backupCode: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    fontFamily: 'monospace',
    textAlign: 'center',
    paddingVertical: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 16,
  },
  copyButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  backupWarning: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
});

export default SecurityScreen;
