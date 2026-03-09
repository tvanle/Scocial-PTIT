import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, StackActions, useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_SPACING } from '../../../constants/dating/tokens';
import { DATING_STRINGS } from '../../../constants/dating/strings';
import type { RootStackParamList } from '../../../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DatingMatch'>;
type Route = RouteProp<RootStackParamList, 'DatingMatch'>;

const colors = DATING_COLORS.discovery;
const layout = DATING_LAYOUT.discovery.match;
const strings = DATING_STRINGS.discovery;

const AVATAR_SIZE = 120;
const HEART_SIZE = 60;
const HEADER_ICON_SIZE = 40;
const ACTION_BUTTON_HEIGHT = 56;

interface MatchHeaderProps {
  onClose: () => void;
}

const MatchHeader: React.FC<MatchHeaderProps> = React.memo(({ onClose }) => (
  <View style={styles.topBar}>
    <TouchableOpacity
      style={styles.iconBtn}
      onPress={onClose}
      accessibilityRole="button"
      accessibilityLabel={strings.matchCloseA11y}
    >
      <MaterialIcons name="close" size={24} color={colors.matchText} />
    </TouchableOpacity>
    <Text style={styles.topTitle} numberOfLines={1}>
      {strings.matchHeaderTitle}
    </Text>
    <View style={styles.iconBtnPlaceholder} />
  </View>
));

interface MatchAvatarsProps {
  avatarUrl: string;
}

const MatchAvatars: React.FC<MatchAvatarsProps> = React.memo(({ avatarUrl }) => (
  <View style={styles.avatarsWrap}>
    <View style={[styles.avatarOuter, styles.avatarLeft]}>
      <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
    </View>

    <View style={styles.heartWrap}>
      <View style={styles.heartCircle}>
        <MaterialIcons name="favorite" size={28} color={colors.matchText} />
      </View>
    </View>

    <View style={[styles.avatarOuter, styles.avatarRight]}>
      <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
    </View>
  </View>
));

interface MatchActionsProps {
  onSendMessage: () => void;
  onContinue: () => void;
}

const MatchActions: React.FC<MatchActionsProps> = React.memo(
  ({ onSendMessage, onContinue }) => (
    <View style={styles.actions}>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={onSendMessage}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={strings.matchSendMessageA11y}
      >
        <MaterialIcons name="chat-bubble" size={20} color={colors.matchText} />
        <Text style={styles.primaryBtnText}>{strings.matchSendMessage}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={onContinue}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={strings.matchContinueDiscoveryA11y}
      >
        <Text style={styles.secondaryBtnText}>{strings.matchContinueDiscovery}</Text>
      </TouchableOpacity>
    </View>
  ),
);

export const DatingMatchScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();

  const profile = params.profile;
  const source = params.source;

  const avatarUrl = useMemo(
    () => profile.photos[0]?.url ?? '',
    [profile.photos],
  );

  const name = profile.user.fullName ?? strings.unknownName;

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
  }, [navigation, source, profile.userId]);

  const handleSendMessage = useCallback(() => {
    navigation.navigate('ChatList');
  }, [navigation]);

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <MatchHeader onClose={handleClose} />

        <View style={styles.content}>
          <MatchAvatars avatarUrl={avatarUrl} />

          <View style={styles.textWrap}>
            <Text style={styles.title}>{strings.matchTitle}</Text>
            <Text style={styles.subtitle}>{strings.matchSubtitle(name)}</Text>
          </View>

          <MatchActions onSendMessage={handleSendMessage} onContinue={handleContinue} />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DATING_SPACING.lg,
    paddingTop: DATING_SPACING.lg,
    paddingBottom: DATING_SPACING.sm,
  },
  iconBtn: {
    width: HEADER_ICON_SIZE,
    height: HEADER_ICON_SIZE,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPlaceholder: {
    width: HEADER_ICON_SIZE,
    height: HEADER_ICON_SIZE,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.subtitleColor,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DATING_SPACING.xl,
  },
  avatarsWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DATING_SPACING.xl,
  },
  avatarOuter: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 9999,
    borderWidth: 4,
    borderColor: DATING_COLORS.light.background,
    backgroundColor: DATING_COLORS.light.background,
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
  },
  heartCircle: {
    width: HEART_SIZE,
    height: HEART_SIZE,
    borderRadius: 9999,
    backgroundColor: DATING_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: DATING_COLORS.light.background,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  textWrap: {
    alignItems: 'center',
    paddingHorizontal: DATING_SPACING.lg,
    marginBottom: DATING_SPACING.xl,
  },
  title: {
    fontSize: layout.textSize,
    fontWeight: '800',
    color: colors.matchText,
    textAlign: 'center',
    marginBottom: DATING_SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: DATING_COLORS.light.textSecondary,
  },
  actions: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: DATING_SPACING.md,
    gap: DATING_SPACING.sm,
  },
  primaryBtn: {
    height: ACTION_BUTTON_HEIGHT,
    borderRadius: 9999,
    backgroundColor: DATING_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: DATING_SPACING.sm,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.matchText,
  },
  secondaryBtn: {
    height: ACTION_BUTTON_HEIGHT,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: DATING_COLORS.primary,
  },
});

export default DatingMatchScreen;

