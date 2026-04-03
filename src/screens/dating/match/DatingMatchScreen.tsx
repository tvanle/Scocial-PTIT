/**
 * Dating Match Screen
 *
 * Shown when two users match, with actions to message or continue
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, StackActions, useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { DatingThemeProvider, useDatingTheme } from '../../../contexts/DatingThemeContext';
import { SPACING, TEXT_STYLES, RADIUS, DURATION } from '../../../constants/dating/design-system';
import type { RootStackParamList } from '../../../types';
import datingChatService from '../../../services/dating/datingChatService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DatingMatch'>;
type Route = RouteProp<RootStackParamList, 'DatingMatch'>;

const AVATAR_SIZE = 120;
const HEART_SIZE = 60;

interface MatchHeaderProps {
  onClose: () => void;
}

const MatchHeader: React.FC<MatchHeaderProps> = React.memo(({ onClose }) => {
  const { theme } = useDatingTheme();

  return (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
        <Ionicons name="close" size={24} color={theme.text.secondary} />
      </TouchableOpacity>
      <Text style={[styles.topTitle, { color: theme.text.secondary }]}>PTIT Connect</Text>
      <View style={styles.iconBtnPlaceholder} />
    </View>
  );
});

interface MatchAvatarsProps {
  avatarUrl: string;
}

const MatchAvatars: React.FC<MatchAvatarsProps> = React.memo(({ avatarUrl }) => {
  const { theme } = useDatingTheme();

  return (
    <View style={styles.avatarsWrap}>
      <Animated.View
        entering={FadeInUp.delay(100).duration(DURATION.normal)}
        style={[styles.avatarOuter, styles.avatarLeft, { borderColor: theme.bg.base, backgroundColor: theme.bg.base }]}
      >
        <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
      </Animated.View>

      <Animated.View
        entering={ZoomIn.delay(300).duration(DURATION.normal)}
        style={styles.heartWrap}
      >
        <View style={[styles.heartCircle, { backgroundColor: theme.brand.primary, borderColor: theme.bg.base }]}>
          <MaterialCommunityIcons name="heart" size={28} color="#FFFFFF" />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(200).duration(DURATION.normal)}
        style={[styles.avatarOuter, styles.avatarRight, { borderColor: theme.bg.base, backgroundColor: theme.bg.base }]}
      >
        <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
      </Animated.View>
    </View>
  );
});

interface MatchActionsProps {
  onSendMessage: () => void;
  onContinue: () => void;
}

const MatchActions: React.FC<MatchActionsProps> = React.memo(({ onSendMessage, onContinue }) => {
  const { theme } = useDatingTheme();

  return (
    <Animated.View
      entering={FadeInUp.delay(500).duration(DURATION.normal)}
      style={styles.actions}
    >
      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: theme.brand.primary }]}
        onPress={onSendMessage}
        activeOpacity={0.9}
      >
        <MaterialCommunityIcons name="chat" size={20} color="#FFFFFF" />
        <Text style={styles.primaryBtnText}>Gui tin nhan</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryBtn, { borderColor: theme.border.medium }]}
        onPress={onContinue}
        activeOpacity={0.9}
      >
        <Text style={[styles.secondaryBtnText, { color: theme.brand.primary }]}>
          Tiep tuc kham pha
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const MatchInner: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { theme } = useDatingTheme();

  const profile = params.profile;
  const source = params.source;

  const avatarUrl = useMemo(() => profile.photos[0]?.url ?? '', [profile.photos]);
  const name = profile.user.fullName ?? 'Ai do';

  React.useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleClose = useCallback(() => {
    if (source === 'detail') {
      navigation.dispatch(StackActions.pop(2));
      return;
    }
    navigation.goBack();
  }, [navigation, source]);

  const handleContinue = useCallback(() => {
    if (source === 'detail') {
      navigation.dispatch(StackActions.pop(2));
      return;
    }
    navigation.goBack();
  }, [navigation, source]);

  const handleSendMessage = useCallback(async () => {
    try {
      const conv = await datingChatService.getOrCreateConversation(profile.userId);
      navigation.navigate('DatingChatRoom', {
        conversationId: conv.id,
        otherUser: conv.otherUser ?? {
          id: profile.userId,
          fullName: profile.user.fullName ?? '',
          avatar: profile.photos[0]?.url ?? null,
        },
      });
    } catch {
      navigation.navigate('DatingTabs', { screen: 'DatingChatsTab' });
    }
  }, [navigation, profile]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <MatchHeader onClose={handleClose} />

        <View style={styles.content}>
          <MatchAvatars avatarUrl={avatarUrl} />

          <Animated.View
            entering={FadeIn.delay(400).duration(DURATION.normal)}
            style={styles.textWrap}
          >
            <Text style={[styles.title, { color: theme.brand.primary }]}>Da Match!</Text>
            <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
              Ban va {name} da thich nhau. Hay bat dau tro chuyen nao!
            </Text>
          </Animated.View>

          <MatchActions onSendMessage={handleSendMessage} onContinue={handleContinue} />
        </View>
      </SafeAreaView>
    </View>
  );
};

export const DatingMatchScreen: React.FC = () => {
  return (
    <DatingThemeProvider>
      <MatchInner />
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPlaceholder: {
    width: 40,
    height: 40,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    ...TEXT_STYLES.labelMedium,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  avatarsWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarOuter: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    overflow: 'hidden',
  },
  avatarLeft: {
    marginRight: -28,
    transform: [{ rotate: '-8deg' }],
  },
  avatarRight: {
    marginLeft: -28,
    transform: [{ rotate: '8deg' }],
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  heartWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heartCircle: {
    width: HEART_SIZE,
    height: HEART_SIZE,
    borderRadius: HEART_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  textWrap: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TEXT_STYLES.bodyMedium,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  primaryBtn: {
    height: 56,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryBtnText: {
    ...TEXT_STYLES.labelLarge,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    height: 56,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...TEXT_STYLES.labelLarge,
  },
});

export default DatingMatchScreen;
