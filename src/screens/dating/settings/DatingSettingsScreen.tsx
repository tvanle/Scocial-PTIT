/**
 * Dating Settings Screen
 *
 * Settings for dating profile, preferences, notifications, privacy
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import { DatingThemeProvider, useDatingTheme } from '../../../contexts/DatingThemeContext';
import { SPACING, TEXT_STYLES, RADIUS, DURATION } from '../../../constants/dating/design-system';
import datingService from '../../../services/dating/datingService';
import datingSettingsService from '../../../services/dating/datingSettingsService';
import pushNotificationService from '../../../services/push/pushNotificationService';
import type { RootStackParamList } from '../../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface SettingToggleProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  icon,
  label,
  description,
  value,
  onValueChange,
}) => {
  const { theme } = useDatingTheme();

  const handleChange = useCallback((val: boolean) => {
    Haptics.selectionAsync();
    onValueChange(val);
  }, [onValueChange]);

  return (
    <View style={[styles.settingRow, { backgroundColor: theme.bg.surface }]}>
      <View style={[styles.settingIconWrap, { backgroundColor: theme.brand.primaryMuted }]}>
        <MaterialCommunityIcons name={icon} size={22} color={theme.brand.primary} />
      </View>
      <View style={styles.settingBody}>
        <Text style={[styles.settingLabel, { color: theme.text.primary }]}>{label}</Text>
        {description && (
          <Text style={[styles.settingDesc, { color: theme.text.muted }]}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={handleChange}
        trackColor={{ false: theme.border.medium, true: theme.brand.primaryMuted }}
        thumbColor={value ? theme.brand.primary : theme.bg.elevated}
      />
    </View>
  );
};

interface SettingLinkProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description?: string;
  onPress: () => void;
  danger?: boolean;
}

const SettingLink: React.FC<SettingLinkProps> = ({
  icon,
  label,
  description,
  onPress,
  danger,
}) => {
  const { theme } = useDatingTheme();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      style={[styles.settingRow, { backgroundColor: theme.bg.surface }]}
      activeOpacity={0.6}
      onPress={handlePress}
    >
      <View style={[
        styles.settingIconWrap,
        { backgroundColor: danger ? theme.semantic.nope.light : theme.brand.primaryMuted }
      ]}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={danger ? theme.semantic.nope.main : theme.brand.primary}
        />
      </View>
      <View style={styles.settingBody}>
        <Text style={[
          styles.settingLabel,
          { color: danger ? theme.semantic.nope.main : theme.text.primary }
        ]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.settingDesc, { color: theme.text.muted }]}>{description}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.text.muted} />
    </TouchableOpacity>
  );
};

interface SectionHeaderProps {
  title: string;
  index: number;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, index }) => {
  const { theme } = useDatingTheme();
  return (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(DURATION.normal)}>
      <Text style={[styles.sectionHeader, { color: theme.text.muted }]}>{title}</Text>
    </Animated.View>
  );
};

const SettingsInner: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { theme } = useDatingTheme();

  const [loading, setLoading] = useState(true);
  const [notifMatches, setNotifMatches] = useState(true);
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [showActiveStatus, setShowActiveStatus] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  // Load settings on mount
  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        setLoading(true);
        try {
          // Load dating settings
          const settings = await datingSettingsService.getSettings();
          setNotifMatches(settings.notifications.matches);
          setNotifLikes(settings.notifications.likes);
          setNotifMessages(settings.notifications.messages);
          setShowDistance(settings.privacy.showDistance);
          setShowActiveStatus(settings.privacy.showActiveStatus);

          // Check push notification permission
          const hasPush = await pushNotificationService.checkPermission();
          setPushEnabled(hasPush);

          // Check location permission
          const { status } = await Location.getForegroundPermissionsAsync();
          setLocationEnabled(status === 'granted');
        } catch (error) {
          console.error('[Settings] Load error:', error);
        } finally {
          setLoading(false);
        }
      };

      loadSettings();
    }, [])
  );

  // Handle notification toggle changes
  const handleNotifMatchesChange = useCallback(async (value: boolean) => {
    setNotifMatches(value);
    await datingSettingsService.updateNotificationSettings({ matches: value });
  }, []);

  const handleNotifLikesChange = useCallback(async (value: boolean) => {
    setNotifLikes(value);
    await datingSettingsService.updateNotificationSettings({ likes: value });
  }, []);

  const handleNotifMessagesChange = useCallback(async (value: boolean) => {
    setNotifMessages(value);
    await datingSettingsService.updateNotificationSettings({ messages: value });
  }, []);

  // Handle privacy toggle changes
  const handleShowDistanceChange = useCallback(async (value: boolean) => {
    setShowDistance(value);
    await datingSettingsService.updatePrivacySettings({ showDistance: value });
  }, []);

  const handleShowActiveChange = useCallback(async (value: boolean) => {
    setShowActiveStatus(value);
    await datingSettingsService.updatePrivacySettings({ showActiveStatus: value });
  }, []);

  // Handle push notification toggle
  const handlePushToggle = useCallback(async (value: boolean) => {
    if (value) {
      const granted = await pushNotificationService.requestPermission();
      setPushEnabled(granted);
      if (granted) {
        await pushNotificationService.initialize();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert(
          'Quyen thong bao',
          'Vui long bat thong bao trong Cai dat de nhan thong bao hen ho.',
          [{ text: 'Dong y' }]
        );
      }
    } else {
      await pushNotificationService.unregister();
      setPushEnabled(false);
    }
  }, []);

  // Handle location toggle
  const handleLocationToggle = useCallback(async (value: boolean) => {
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationEnabled(granted);

      if (granted) {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          await datingService.updateLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          queryClient.invalidateQueries({ queryKey: ['dating'] });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
          console.error('[Settings] Location update error:', err);
        }
      } else {
        Alert.alert(
          'Quyen vi tri',
          'Vui long bat vi tri trong Cai dat de hien thi khoang cach.',
          [{ text: 'Dong y' }]
        );
      }
    } else {
      setLocationEnabled(false);
    }
  }, [queryClient]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleEditProfile = useCallback(() => {
    navigation.navigate('DatingProfileSetup', { from: 'settings' });
  }, [navigation]);

  const handleEditPreferences = useCallback(() => {
    navigation.navigate('DatingPreferencesSetup', { from: 'settings' });
  }, [navigation]);

  const handleBlockedUsers = useCallback(() => {
    navigation.navigate('DatingBlockedUsers');
  }, [navigation]);

  const handlePauseProfile = useCallback(() => {
    Alert.alert(
      'Tam dung hen ho',
      'Ho so cua ban se bi an khoi kham pha. Ban co the bat lai bat cu luc nao.',
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Tam dung',
          onPress: async () => {
            try {
              await datingService.updateProfile({ isActive: false });
              queryClient.invalidateQueries({ queryKey: ['dating'] });
              navigation.navigate('DatingPaused');
            } catch {
              Alert.alert('Loi', 'Khong the tam dung ho so. Vui long thu lai.');
            }
          },
        },
      ]
    );
  }, [navigation, queryClient]);

  const handleDeleteProfile = useCallback(() => {
    Alert.alert(
      'Xoa ho so hen ho',
      'Ho so, anh, cau hoi va tat ca du lieu hen ho se bi xoa vinh vien. Ban chac chan?',
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Xoa',
          style: 'destructive',
          onPress: async () => {
            try {
              await datingService.deleteProfile();
              queryClient.removeQueries({ queryKey: ['dating'] });
              navigation.navigate('DatingSplash');
            } catch {
              Alert.alert('Loi', 'Khong the xoa ho so. Vui long thu lai.');
            }
          },
        },
      ]
    );
  }, [navigation, queryClient]);

  const handlePrivacyPolicy = useCallback(() => {
    navigation.navigate('DatingLegal', { type: 'privacy' });
  }, [navigation]);

  const handleTerms = useCallback(() => {
    navigation.navigate('DatingLegal', { type: 'terms' });
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border.subtle }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Cai dat</Text>
          <View style={styles.headerBtnPlaceholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.brand.primary} />
          </View>
        ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile & Preferences */}
          <SectionHeader title="HO SO & TIEU CHI" index={0} />
          <View style={[styles.section, { borderColor: theme.border.subtle }]}>
            <SettingLink
              icon="account"
              label="Chinh sua ho so"
              description="Anh, bio, cau hoi ve ban"
              onPress={handleEditProfile}
            />
            <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />
            <SettingLink
              icon="tune"
              label="Tieu chi hen ho"
              description="Do tuoi, khoang cach, gioi tinh"
              onPress={handleEditPreferences}
            />
          </View>

          {/* Notifications */}
          <SectionHeader title="THONG BAO" index={1} />
          <View style={[styles.section, { borderColor: theme.border.subtle }]}>
            <SettingToggle
              icon="bell-ring"
              label="Push Notification"
              description="Nhan thong bao day tu ung dung"
              value={pushEnabled}
              onValueChange={handlePushToggle}
            />
            <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />
            <SettingToggle
              icon="heart"
              label="Match moi"
              description="Thong bao khi co nguoi match voi ban"
              value={notifMatches}
              onValueChange={handleNotifMatchesChange}
            />
            <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />
            <SettingToggle
              icon="thumb-up"
              label="Luot thich moi"
              description="Thong bao khi co nguoi thich ho so cua ban"
              value={notifLikes}
              onValueChange={handleNotifLikesChange}
            />
            <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />
            <SettingToggle
              icon="chat"
              label="Tin nhan moi"
              description="Thong bao khi nhan duoc tin nhan"
              value={notifMessages}
              onValueChange={handleNotifMessagesChange}
            />
          </View>

          {/* Privacy */}
          <SectionHeader title="QUYEN RIENG TU & VI TRI" index={2} />
          <View style={[styles.section, { borderColor: theme.border.subtle }]}>
            <SettingToggle
              icon="crosshairs-gps"
              label="Quyen vi tri"
              description="Cho phep ung dung truy cap vi tri cua ban"
              value={locationEnabled}
              onValueChange={handleLocationToggle}
            />
            <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />
            <SettingToggle
              icon="map-marker"
              label="Hien thi khoang cach"
              description="Cho phep nguoi khac thay khoang cach den ban"
              value={showDistance}
              onValueChange={handleShowDistanceChange}
            />
            <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />
            <SettingToggle
              icon="circle"
              label="Trang thai hoat dong"
              description="Hien thi khi ban dang online"
              value={showActiveStatus}
              onValueChange={handleShowActiveChange}
            />
            <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />
            <SettingLink
              icon="cancel"
              label="Nguoi dung bi chan"
              description="Quan ly danh sach nguoi bi chan"
              onPress={handleBlockedUsers}
            />
          </View>

          {/* Account */}
          <SectionHeader title="TAI KHOAN" index={3} />
          <View style={[styles.section, { borderColor: theme.border.subtle }]}>
            <SettingLink
              icon="pause-circle-outline"
              label="Tam dung hen ho"
              description="An ho so khoi phan kham pha"
              onPress={handlePauseProfile}
            />
            <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />
            <SettingLink
              icon="delete-outline"
              label="Xoa ho so hen ho"
              description="Xoa vinh vien ho so hen ho cua ban"
              onPress={handleDeleteProfile}
              danger
            />
          </View>

          {/* Legal */}
          <SectionHeader title="PHAP LY" index={4} />
          <View style={[styles.section, { borderColor: theme.border.subtle }]}>
            <SettingLink
              icon="shield-check"
              label="Chinh sach quyen rieng tu"
              onPress={handlePrivacyPolicy}
            />
            <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />
            <SettingLink
              icon="file-document-outline"
              label="Dieu khoan su dung"
              onPress={handleTerms}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.text.muted }]}>
              PTIT Connect v1.0.0
            </Text>
          </View>
        </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
};

export const DatingSettingsScreen: React.FC = () => {
  return (
    <DatingThemeProvider>
      <SettingsInner />
    </DatingThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPlaceholder: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...TEXT_STYLES.headingMedium,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Sections
  sectionHeader: {
    ...TEXT_STYLES.labelSmall,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },

  // Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  settingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  settingBody: {
    flex: 1,
  },
  settingLabel: {
    ...TEXT_STYLES.labelMedium,
  },
  settingDesc: {
    ...TEXT_STYLES.bodySmall,
    marginTop: 2,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  footerText: {
    ...TEXT_STYLES.tiny,
  },
});

export default DatingSettingsScreen;
