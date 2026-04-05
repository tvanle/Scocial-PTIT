/**
 * Dating Legal Screen
 *
 * Displays legal documents (Privacy Policy, Terms of Service)
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';

import { DatingThemeProvider, useDatingTheme } from '../../../contexts/DatingThemeContext';
import { SPACING, TEXT_STYLES, RADIUS, DURATION } from '../../../constants/dating/design-system';
import type { RootStackParamList } from '../../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'DatingLegal'>;

const PRIVACY_POLICY_CONTENT = `
Chinh Sach Quyen Rieng Tu - PTIT Connect

Cap nhat lan cuoi: 01/04/2026

1. Thong Tin Chung Toi Thu Thap

Chung toi thu thap thong tin ban cung cap khi dang ky tai khoan, tao ho so hen ho, va su dung dich vu cua chung toi, bao gom:
- Thong tin ca nhan: ten, tuoi, gioi tinh, anh dai dien
- Thong tin lien lac: email, so dien thoai
- Vi tri: khi ban cho phep, de tim nguoi o gan ban
- Tuong tac: like, match, tin nhan

2. Cach Chung Toi Su Dung Thong Tin

Thong tin cua ban duoc su dung de:
- Cung cap dich vu hen ho va ket noi
- Ca nhan hoa trai nghiem nguoi dung
- Gui thong bao ve match va tin nhan moi
- Cai thien dich vu va bao mat

3. Chia Se Thong Tin

Chung toi khong ban thong tin ca nhan cua ban. Thong tin chi duoc chia se trong cac truong hop:
- Voi su dong y cua ban
- Theo yeu cau phap ly
- De bao ve an toan nguoi dung

4. Bao Mat

Chung toi ap dung cac bien phap bao mat tieu chuan nganh de bao ve thong tin cua ban.

5. Quyen Cua Ban

Ban co the:
- Truy cap va cap nhat thong tin ca nhan
- Xoa tai khoan va du lieu
- Tu choi nhan thong bao

6. Lien He

Neu co thac mac ve chinh sach quyen rieng tu, vui long lien he: support@ptitconnect.edu.vn
`;

const TERMS_OF_SERVICE_CONTENT = `
Dieu Khoan Su Dung - PTIT Connect

Cap nhat lan cuoi: 01/04/2026

1. Chap Nhan Dieu Khoan

Khi su dung PTIT Connect, ban dong y tuan theo cac dieu khoan nay. Neu khong dong y, vui long ngung su dung dich vu.

2. Dieu Kien Su Dung

De su dung dich vu, ban phai:
- La sinh vien hoac cuu sinh vien PTIT
- Tu 18 tuoi tro len
- Cung cap thong tin chinh xac
- Khong vi pham phap luat

3. Hanh Vi Bi Cam

Nghiem cam:
- Gia mao danh tinh
- Quay roi, de doa nguoi khac
- Dang noi dung khong phu hop
- Su dung bot hoac tu dong hoa
- Spam hoac quang cao

4. Noi Dung Nguoi Dung

Ban chiu trach nhiem ve noi dung ban dang. Chung toi co the xoa noi dung vi pham ma khong can thong bao truoc.

5. Cham Dut

Chung toi co quyen:
- Tam khoa hoac xoa tai khoan vi pham
- Thay doi hoac ngung dich vu
- Cap nhat dieu khoan su dung

6. Gioi Han Trach Nhiem

Dich vu duoc cung cap "nguyen trang". Chung toi khong dam bao ket qua cu the tu viec su dung dich vu.

7. Thay Doi Dieu Khoan

Chung toi co the cap nhat dieu khoan bat ky luc nao. Ban se duoc thong bao ve cac thay doi quan trong.

8. Lien He

Email: support@ptitconnect.edu.vn
`;

const LegalInner: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { theme } = useDatingTheme();

  const type = route.params?.type ?? 'privacy';
  const isPrivacy = type === 'privacy';

  const title = isPrivacy ? 'Chinh sach quyen rieng tu' : 'Dieu khoan su dung';
  const icon = isPrivacy ? 'shield-check' : 'file-document-outline';
  const content = isPrivacy ? PRIVACY_POLICY_CONTENT : TERMS_OF_SERVICE_CONTENT;

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleContact = useCallback(() => {
    Linking.openURL('mailto:support@ptitconnect.edu.vn');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border.subtle }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialCommunityIcons
              name={icon as any}
              size={20}
              color={theme.brand.primary}
            />
            <Text style={[styles.headerTitle, { color: theme.text.primary }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <View style={styles.headerBtnPlaceholder} />
        </View>

        <Animated.ScrollView
          entering={FadeIn.duration(DURATION.slow)}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.content, { color: theme.text.primary }]}>
            {content}
          </Text>

          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: theme.brand.primaryMuted }]}
            onPress={handleContact}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="email-outline" size={20} color={theme.brand.primary} />
            <Text style={[styles.contactBtnText, { color: theme.brand.primary }]}>
              Lien he ho tro
            </Text>
          </TouchableOpacity>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
};

export const DatingLegalScreen: React.FC = () => {
  return (
    <DatingThemeProvider>
      <LegalInner />
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
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  headerTitle: {
    ...TEXT_STYLES.headingMedium,
    fontSize: 17,
  },

  // Content
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  content: {
    ...TEXT_STYLES.bodyMedium,
    lineHeight: 24,
  },

  // Contact button
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
  },
  contactBtnText: {
    ...TEXT_STYLES.labelMedium,
    fontWeight: '600',
  },
});

export default DatingLegalScreen;
