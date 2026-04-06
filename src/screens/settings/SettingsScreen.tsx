import React, { useState } from 'react';
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
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { RootStackParamList } from '../../types';
import { authService } from '../../services/auth/authService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// --- Row item ---
interface SettingRowProps {
  title: string;
  value?: string;
  valueColor?: string;
  onPress?: () => void;
  isLast?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({ title, value, valueColor, onPress, isLast }) => (
  <TouchableOpacity
    style={[styles.row, !isLast && styles.rowBorder]}
    onPress={onPress}
    activeOpacity={0.6}
    disabled={!onPress}
  >
    <Text style={styles.rowTitle}>{title}</Text>
    <View style={styles.rowRight}>
      {value ? (
        <Text style={[styles.rowValue, valueColor ? { color: valueColor } : undefined]}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={Colors.gray300} />
    </View>
  </TouchableOpacity>
);

// --- Section ---
interface SectionProps {
  label: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ label, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionLabelContainer}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionLabelLine} />
    </View>
    <View>{children}</View>
  </View>
);

// --- Main screen ---
const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();

  // Change password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back + Title */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Settings</Text>

        {/* ACCOUNT */}
        <Section label="ACCOUNT">
          <SettingRow
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingRow
            title="University Verification"
            value={user?.isVerified ? 'Verified' : 'Not Verified'}
            valueColor={user?.isVerified ? Colors.success : Colors.gray400}
          />
          <SettingRow
            title="Change Password"
            onPress={() => setShowPasswordModal(true)}
          />
          <SettingRow
            title="Security"
            value="2FA, Sessions"
            onPress={() => navigation.navigate('Security')}
            isLast
          />
        </Section>

        {/* SUPPORT */}
        <Section label="SUPPORT">
          <SettingRow
            title="Help Center"
            onPress={() => handleOpenUrl('https://ptit.edu.vn')}
          />
          <SettingRow
            title="Terms of Service"
            onPress={() => handleOpenUrl('https://ptit.edu.vn/terms')}
          />
          <SettingRow
            title="Report a Bug"
            onPress={() => handleOpenUrl('mailto:support@ptit.edu.vn')}
            isLast
          />
        </Section>

        {/* Log Out button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>VERSION 1.0.0 (CAMPUS EDITION)</Text>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Modal Body */}
          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor={Colors.gray400}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new password (min 6 chars)"
                placeholderTextColor={Colors.gray400}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor={Colors.gray400}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
            </View>
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
    backgroundColor: Colors.white,
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
    color: Colors.primary,
    marginLeft: 2,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
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
    color: Colors.gray400,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sectionLabelLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.gray200,
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
    borderBottomColor: Colors.gray200,
  },
  rowTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValue: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
  },

  /* Log Out */
  logoutButton: {
    marginTop: 32,
    backgroundColor: 'rgba(179, 38, 30, 0.08)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },

  /* Version */
  version: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: Colors.gray300,
    letterSpacing: 1.2,
  },

  /* Modal */
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray200,
  },
  modalCancel: {
    fontSize: FontSize.lg,
    color: Colors.primary,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  modalSave: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.primary,
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
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.gray50,
  },
});

export default SettingsScreen;
