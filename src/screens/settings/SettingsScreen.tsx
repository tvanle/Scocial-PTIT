import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import Avatar from '../../components/common/Avatar';
import { useAuthStore } from '../../store/slices/authSlice';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Dang xuat',
      'Ban co chac chan muon dang xuat?',
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Dang xuat',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Xoa tai khoan',
      'Hanh dong nay khong the hoan tac. Tat ca du lieu cua ban se bi xoa vinh vien.',
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Xoa tai khoan',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Xac nhan',
              'Ban thuc su muon xoa tai khoan? Nhap "DELETE" de xac nhan.',
              [
                { text: 'Huy', style: 'cancel' },
                {
                  text: 'Xac nhan xoa',
                  style: 'destructive',
                  onPress: async () => {
                    // TODO: Call delete account API when backend supports it
                    await logout();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Loi', 'Khong the mo lien ket');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cai dat</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Avatar
            uri={user?.avatar || 'https://i.pravatar.cc/150?img=3'}
            size={60}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            <Text style={styles.editProfile}>Chinh sua trang ca nhan</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </TouchableOpacity>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tai khoan</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="person-outline"
              iconColor={colors.primary}
              title="Thong tin ca nhan"
              subtitle="Ten, so dien thoai, email"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <SettingItem
              icon="lock-closed-outline"
              iconColor={colors.info}
              title="Mat khau & Bao mat"
              subtitle="Doi mat khau, xac thuc 2 buoc"
              onPress={() => Alert.alert('Mat khau & Bao mat', 'Tinh nang dang phat trien')}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              iconColor={colors.success}
              title="Quyen rieng tu"
              subtitle="Ai co the xem noi dung cua ban"
              onPress={() => Alert.alert('Quyen rieng tu', 'Tinh nang dang phat trien')}
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tuy chon</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications-outline"
              iconColor={colors.warning}
              title="Thong bao"
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
              title="Che do toi"
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
              title="Tai khoan rieng tu"
              subtitle="Chi ban be moi xem duoc bai viet"
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
              title="Ngon ngu"
              subtitle="Tieng Viet"
              onPress={() => Alert.alert('Ngon ngu', 'Hien tai chi ho tro Tieng Viet')}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ho tro</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="help-circle-outline"
              iconColor={colors.info}
              title="Trung tam tro giup"
              onPress={() => handleOpenUrl('https://ptit.edu.vn')}
            />
            <SettingItem
              icon="chatbubble-ellipses-outline"
              iconColor={colors.success}
              title="Lien he ho tro"
              onPress={() => handleOpenUrl('mailto:support@ptit.edu.vn')}
            />
            <SettingItem
              icon="document-text-outline"
              iconColor={colors.text.secondary}
              title="Dieu khoan su dung"
              onPress={() => handleOpenUrl('https://ptit.edu.vn/terms')}
            />
            <SettingItem
              icon="shield-outline"
              iconColor={colors.text.secondary}
              title="Chinh sach bao mat"
              onPress={() => handleOpenUrl('https://ptit.edu.vn/privacy')}
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thong tin</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="information-circle-outline"
              iconColor={colors.primary}
              title="Ve ung dung"
              subtitle="Phien ban 1.0.0"
              onPress={() => Alert.alert('PTIT Social', 'Phien ban 1.0.0\nPhat trien boi sinh vien PTIT')}
            />
            <SettingItem
              icon="star-outline"
              iconColor={colors.warning}
              title="Danh gia ung dung"
              onPress={() => Alert.alert('Danh gia', 'Tinh nang se kha dung khi app len App Store')}
            />
          </View>
        </View>

        {/* Logout & Delete */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={colors.primary} />
              <Text style={styles.logoutText}>Dang xuat</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Xoa tai khoan</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>PTIT Social</Text>
          <Text style={styles.footerText}>Phien ban 1.0.0</Text>
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
