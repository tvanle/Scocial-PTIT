import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// --- Row item ---
interface SettingRowProps {
  title: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({ title, value, onPress, isLast }) => (
  <TouchableOpacity
    style={[styles.row, !isLast && styles.rowBorder]}
    onPress={onPress}
    activeOpacity={0.6}
    disabled={!onPress}
  >
    <Text style={styles.rowTitle}>{title}</Text>
    <View style={styles.rowRight}>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
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
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// --- Main screen ---
const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();

  const isVerified = user?.isVerified;

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Lỗi', 'Không thể mở liên kết');
    });
  };

  const comingSoon = (feature: string) => {
    Alert.alert(feature, 'Tính năng đang phát triển');
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
            value={isVerified ? 'Verified' : 'Not Verified'}
            onPress={() => comingSoon('University Verification')}
          />
          <SettingRow
            title="Password & Security"
            onPress={() => comingSoon('Password & Security')}
            isLast
          />
        </Section>

        {/* PRIVACY */}
        <Section label="PRIVACY">
          <SettingRow
            title="Profile Visibility"
            onPress={() => comingSoon('Profile Visibility')}
          />
          <SettingRow
            title="Blocked Users"
            onPress={() => comingSoon('Blocked Users')}
          />
          <SettingRow
            title="Data Usage"
            onPress={() => comingSoon('Data Usage')}
            isLast
          />
        </Section>

        {/* NOTIFICATIONS */}
        <Section label="NOTIFICATIONS">
          <SettingRow
            title="Push Notifications"
            onPress={() => comingSoon('Push Notifications')}
          />
          <SettingRow
            title="Quiet Hours"
            value="Off"
            onPress={() => comingSoon('Quiet Hours')}
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
        <Text style={styles.version}>VERSION 2.4.1 (CAMPUS EDITION)</Text>
      </ScrollView>
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
  sectionContent: {},

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
});

export default SettingsScreen;
