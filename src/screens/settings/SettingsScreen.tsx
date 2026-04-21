import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontSize, FontWeight } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { useTheme } from '../../hooks/useThemeColors';
import { RootStackParamList } from '../../types';
import { authService } from '../../services/auth/authService';
import { ThemeMode } from '../../store/slices/themeSlice';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// --- Row item ---
interface SettingRowProps {
  title: string;
  value?: string;
  valueColor?: string;
  onPress?: () => void;
  isLast?: boolean;
  colors: any;
}

const SettingRow: React.FC<SettingRowProps> = ({ title, value, valueColor, onPress, isLast, colors }) => (
  <TouchableOpacity
    style={[
      styles.row,
      !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.gray200 }
    ]}
    onPress={onPress}
    activeOpacity={0.6}
    disabled={!onPress}
  >
    <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{title}</Text>
    <View style={styles.rowRight}>
      {value ? (
        <Text style={[styles.rowValue, { color: valueColor || colors.gray400 }]}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.gray300} />
    </View>
  </TouchableOpacity>
);

// --- Section ---
interface SectionProps {
  label: string;
  children: React.ReactNode;
  colors: any;
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

// --- Main screen ---
const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();
  const { colors, mode, setMode, isDark } = useTheme();

  // Change password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleLogout = () => {
    showAlert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => { logout(); },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      showAlert('Thành công', 'Đổi mật khẩu thành công!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.';
      showAlert('Lỗi', msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      showAlert('Lỗi', 'Không thể mở liên kết');
    });
  };

  const getThemeModeLabel = (themeMode: ThemeMode) => {
    switch (themeMode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
    }
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: 'light', label: 'Light', icon: 'sunny-outline' },
    { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
    { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: colors.background },
    backText: { color: colors.primary },
    screenTitle: { color: colors.textPrimary },
    logoutButton: { backgroundColor: colors.primaryLight },
    logoutText: { color: colors.primary },
    version: { color: colors.gray300 },
    modalContainer: { backgroundColor: colors.background },
    modalHeader: { borderBottomColor: colors.gray200 },
    modalCancel: { color: colors.primary },
    modalTitle: { color: colors.textPrimary },
    modalSave: { color: colors.primary },
    inputLabel: { color: colors.textSecondary },
    input: {
      borderColor: colors.gray200,
      color: colors.textPrimary,
      backgroundColor: colors.gray50
    },
  }), [colors]);

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back + Title */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text style={[styles.backText, dynamicStyles.backText]}>Back</Text>
        </TouchableOpacity>

        <Text style={[styles.screenTitle, dynamicStyles.screenTitle]}>Settings</Text>

        {/* ACCOUNT */}
        <Section label="ACCOUNT" colors={colors}>
          <SettingRow
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
            colors={colors}
          />
          <SettingRow
            title="University Verification"
            value={user?.isVerified ? 'Verified' : 'Not Verified'}
            valueColor={user?.isVerified ? colors.success : colors.gray400}
            colors={colors}
          />
          <SettingRow
            title="Change Password"
            onPress={() => setShowPasswordModal(true)}
            colors={colors}
          />
          <SettingRow
            title="Security"
            value="2FA, Sessions"
            onPress={() => navigation.navigate('Security')}
            isLast
            colors={colors}
          />
        </Section>

        {/* APPEARANCE */}
        <Section label="APPEARANCE" colors={colors}>
          <SettingRow
            title="Theme"
            value={getThemeModeLabel(mode)}
            onPress={() => setShowThemeModal(true)}
            isLast
            colors={colors}
          />
        </Section>

        {/* SUPPORT */}
        <Section label="SUPPORT" colors={colors}>
          <SettingRow
            title="Help Center"
            onPress={() => handleOpenUrl('https://ptit.edu.vn')}
            colors={colors}
          />
          <SettingRow
            title="Terms of Service"
            onPress={() => handleOpenUrl('https://ptit.edu.vn/terms')}
            colors={colors}
          />
          <SettingRow
            title="Report a Bug"
            onPress={() => handleOpenUrl('mailto:support@ptit.edu.vn')}
            isLast
            colors={colors}
          />
        </Section>

        {/* Log Out button */}
        <TouchableOpacity style={[styles.logoutButton, dynamicStyles.logoutButton]} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={[styles.logoutText, dynamicStyles.logoutText]}>Log Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={[styles.version, dynamicStyles.version]}>VERSION 1.0.0 (CAMPUS EDITION)</Text>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, dynamicStyles.modalContainer]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={[styles.modalCancel, dynamicStyles.modalCancel]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Change Password</Text>
            <TouchableOpacity onPress={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.modalSave, dynamicStyles.modalSave]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Modal Body */}
          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Current Password</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input]}
                placeholder="Enter current password"
                placeholderTextColor={colors.gray400}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>New Password</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input]}
                placeholder="Enter new password (min 6 chars)"
                placeholderTextColor={colors.gray400}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Confirm New Password</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input]}
                placeholder="Re-enter new password"
                placeholderTextColor={colors.gray400}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, dynamicStyles.modalContainer]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
            <TouchableOpacity onPress={() => setShowThemeModal(false)}>
              <Text style={[styles.modalCancel, dynamicStyles.modalCancel]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Appearance</Text>
            <View style={{ width: 50 }} />
          </View>

          {/* Theme Options */}
          <View style={styles.modalBody}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.mode}
                style={[
                  styles.themeOption,
                  { borderColor: colors.gray200 },
                  mode === option.mode && { borderColor: colors.primary, backgroundColor: colors.primaryLight }
                ]}
                onPress={() => {
                  setMode(option.mode);
                  setShowThemeModal(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.themeOptionContent}>
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={mode === option.mode ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[
                    styles.themeOptionLabel,
                    { color: mode === option.mode ? colors.primary : colors.textPrimary }
                  ]}>
                    {option.label}
                  </Text>
                </View>
                {mode === option.mode && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// ――――――――――――――  Styles  ――――――――――――――
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

  /* Header */
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

  /* Section */
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

  /* Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValue: {
    fontSize: FontSize.sm,
  },

  /* Log Out */
  logoutButton: {
    marginTop: 32,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },

  /* Version */
  version: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: FontWeight.medium,
    letterSpacing: 1.2,
  },

  /* Modal */
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: FontSize.md,
  },

  /* Theme Options */
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 12,
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeOptionLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
  },
});

export default SettingsScreen;
