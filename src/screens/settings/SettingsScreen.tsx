import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import Avatar from '../../components/common/Avatar';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  iconColor = colors.text.secondary,
  title,
  subtitle,
  onPress,
  rightElement,
  showArrow = true,
}) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
    <View style={[styles.settingIcon, { backgroundColor: iconColor + '15' }]}>
      <Ionicons name={icon} size={22} color={iconColor} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement || (showArrow && onPress && (
      <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
    ))}
  </TouchableOpacity>
);

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            // TODO: Clear auth state and navigate to login
            console.log('Logout');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Xóa tài khoản',
      'Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tài khoản',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Xác nhận',
              'Nhập "DELETE" để xác nhận xóa tài khoản',
              [
                { text: 'Hủy', style: 'cancel' },
                {
                  text: 'Xác nhận',
                  style: 'destructive',
                  onPress: (text) => {
                    if (text === 'DELETE') {
                      // TODO: Delete account API call
                      console.log('Delete account');
                    } else {
                      Alert.alert('Lỗi', 'Nhập không chính xác');
                    }
                  },
                },
              ],
              'plain-text'
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <TouchableOpacity style={styles.profileSection}>
          <Avatar
            source={{ uri: 'https://i.pravatar.cc/150?img=3' }}
            size={60}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Nguyễn Văn A</Text>
            <Text style={styles.profileEmail}>nguyenvana@ptit.edu.vn</Text>
            <Text style={styles.editProfile}>Chỉnh sửa trang cá nhân</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </TouchableOpacity>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="person-outline"
              iconColor={colors.primary}
              title="Thông tin cá nhân"
              subtitle="Tên, số điện thoại, email"
              onPress={() => {}}
            />
            <SettingItem
              icon="lock-closed-outline"
              iconColor={colors.info}
              title="Mật khẩu & Bảo mật"
              subtitle="Đổi mật khẩu, xác thực 2 bước"
              onPress={() => {}}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              iconColor={colors.success}
              title="Quyền riêng tư"
              subtitle="Ai có thể xem nội dung của bạn"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tùy chọn</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications-outline"
              iconColor={colors.warning}
              title="Thông báo"
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.gray[300], true: colors.primary + '50' }}
                  thumbColor={notifications ? colors.primary : colors.gray[100]}
                />
              }
              showArrow={false}
            />
            <SettingItem
              icon="moon-outline"
              iconColor={colors.text.secondary}
              title="Chế độ tối"
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: colors.gray[300], true: colors.primary + '50' }}
                  thumbColor={darkMode ? colors.primary : colors.gray[100]}
                />
              }
              showArrow={false}
            />
            <SettingItem
              icon="eye-off-outline"
              iconColor={colors.error}
              title="Tài khoản riêng tư"
              subtitle="Chỉ bạn bè mới xem được bài viết"
              rightElement={
                <Switch
                  value={privateAccount}
                  onValueChange={setPrivateAccount}
                  trackColor={{ false: colors.gray[300], true: colors.primary + '50' }}
                  thumbColor={privateAccount ? colors.primary : colors.gray[100]}
                />
              }
              showArrow={false}
            />
            <SettingItem
              icon="language-outline"
              iconColor={colors.info}
              title="Ngôn ngữ"
              subtitle="Tiếng Việt"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hỗ trợ</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="help-circle-outline"
              iconColor={colors.info}
              title="Trung tâm trợ giúp"
              onPress={() => {}}
            />
            <SettingItem
              icon="chatbubble-ellipses-outline"
              iconColor={colors.success}
              title="Liên hệ hỗ trợ"
              onPress={() => {}}
            />
            <SettingItem
              icon="document-text-outline"
              iconColor={colors.text.secondary}
              title="Điều khoản sử dụng"
              onPress={() => {}}
            />
            <SettingItem
              icon="shield-outline"
              iconColor={colors.text.secondary}
              title="Chính sách bảo mật"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="information-circle-outline"
              iconColor={colors.primary}
              title="Về ứng dụng"
              subtitle="Phiên bản 1.0.0"
              onPress={() => {}}
            />
            <SettingItem
              icon="star-outline"
              iconColor={colors.warning}
              title="Đánh giá ứng dụng"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Logout & Delete */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={colors.primary} />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Xóa tài khoản</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>PTIT Social</Text>
          <Text style={styles.footerText}>Phiên bản 1.0.0</Text>
          <Text style={styles.footerCopyright}>© 2024 PTIT. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  profileEmail: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  editProfile: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  settingTitle: {
    ...typography.body,
    color: colors.text.primary,
  },
  settingSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  logoutText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  deleteText: {
    ...typography.body,
    color: colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  footerText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  footerCopyright: {
    ...typography.caption,
    color: colors.text.placeholder,
    marginTop: spacing.xs,
  },
});

export default SettingsScreen;
