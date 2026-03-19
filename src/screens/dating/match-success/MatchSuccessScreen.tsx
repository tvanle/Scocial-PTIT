import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating/strings';
import { matchSuccessStyles as styles } from './MatchSuccessStyles';
import type { MatchItem, RootStackParamList } from '../../../types';
import { useAuthStore } from '../../../store/slices/authSlice';
import datingChatService from '../../../services/dating/datingChatService';

type RouteParams = RouteProp<{ DatingMatchSuccess: { match: MatchItem } }, 'DatingMatchSuccess'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const MatchSuccessScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteParams>();
  const { match } = route.params;
  const currentUser = useAuthStore((s) => s.user);

  const matchedUser = match?.matchedUser;
  const matchedName = matchedUser?.fullName ?? DATING_STRINGS.discovery.unknownName;
  const matchedAvatar = matchedUser?.avatar;
  const currentAvatar = currentUser?.avatar;

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSendMessage = useCallback(async () => {
    if (!matchedUser?.id) return;
    try {
      const conv = await datingChatService.getOrCreateConversation(matchedUser.id);
      navigation.navigate('DatingChatRoom', {
        conversationId: conv.id,
        otherUser: {
          id: matchedUser.id,
          fullName: matchedUser.fullName,
          avatar: matchedUser.avatar ?? null,
        },
      });
    } catch {
      navigation.navigate('DatingChatList');
    }
  }, [navigation, matchedUser]);

  const handleContinueDiscovering = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    if (!match || !matchedUser) {
      navigation.goBack();
    }
  }, [match, matchedUser, navigation]);

  if (!match || !matchedUser) {
    return null;
  }

  return (
    <View style={styles.root}>
      <View style={styles.confettiOverlay} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel={DATING_STRINGS.discovery.matchCloseA11y}
            accessibilityHint={DATING_STRINGS.discovery.matchCloseA11y}
          >
            <MaterialIcons name="close" size={24} color={DATING_COLORS.profileDetail.name} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{DATING_STRINGS.discovery.matchHeaderTitle}</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarLeft}>
              <View style={styles.avatar}>
                {currentAvatar ? (
                  <Image source={{ uri: currentAvatar }} style={styles.avatarImage} />
                ) : null}
              </View>
            </View>
            <View style={styles.heartWrap}>
              <MaterialIcons
                name="favorite"
                size={24}
                color={DATING_COLORS.onboarding.buttonText}
              />
            </View>
            <View style={styles.avatarRight}>
              <View style={styles.avatar}>
                {matchedAvatar ? (
                  <Image source={{ uri: matchedAvatar }} style={styles.avatarImage} />
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.title} accessibilityRole="header">
              {DATING_STRINGS.discovery.matchTitle}
            </Text>
            <Text style={styles.subtitle}>
              {DATING_STRINGS.discovery.matchSubtitle(matchedName)}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={handleSendMessage}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={DATING_STRINGS.discovery.matchSendMessageA11y}
              accessibilityHint={DATING_STRINGS.discovery.matchSendMessageA11y}
            >
              <MaterialIcons
                name="chat-bubble-outline"
                size={22}
                color={DATING_COLORS.onboarding.buttonText}
              />
              <Text style={styles.primaryBtnText}>
                {DATING_STRINGS.discovery.matchSendMessage}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleContinueDiscovering}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={DATING_STRINGS.discovery.matchContinueDiscoveryA11y}
              accessibilityHint={DATING_STRINGS.discovery.matchContinueDiscoveryA11y}
            >
              <Text style={styles.secondaryBtnText}>
                {DATING_STRINGS.discovery.matchContinueDiscovery}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.spacer} />
      </SafeAreaView>
    </View>
  );
};

export default MatchSuccessScreen;
