/**
 * Dating Chat Room Screen
 *
 * Modern chat room with new design system
 * Features: bubbles, icebreakers, haptic feedback
 */

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DatingThemeProvider, useDatingTheme } from '../../../contexts/DatingThemeContext';
import {
  SPACING,
  RADIUS,
  TEXT_STYLES,
  DURATION,
  SPRING,
  AVATAR,
} from '../../../constants/dating/design-system';
import datingChatService from '../../../services/dating/datingChatService';
import datingService from '../../../services/dating/datingService';
import socketService from '../../../services/socket/socketService';
import { useAuthStore } from '../../../store/slices/authSlice';
import type { RootStackParamList } from '../../../types';
import type { DatingMessage } from '../../../types/dating';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type RouteParams = RouteProp<RootStackParamList, 'DatingChatRoom'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

interface PromptReplyContent {
  type: 'prompt_reply';
  prompt: { question: string; answer: string };
  reply: string;
}

const parsePromptReply = (content: string): PromptReplyContent | null => {
  try {
    const parsed = JSON.parse(content);
    console.log('[ChatRoom] Parsed message:', parsed?.type, parsed);
    if (parsed?.type === 'prompt_reply' && parsed.prompt && parsed.reply) {
      return parsed as PromptReplyContent;
    }
  } catch (e) {
    // Not a JSON message - that's fine for regular messages
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════
// MESSAGE BUBBLE
// ═══════════════════════════════════════════════════════════════

interface BubbleProps {
  message: DatingMessage;
  isMine: boolean;
  showAvatar: boolean;
  isLast: boolean;
  index: number;
}

const Bubble: React.FC<BubbleProps> = React.memo(({ message, isMine, showAvatar, isLast, index }) => {
  const { theme } = useDatingTheme();

  const time = new Date(message.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Check if this is a prompt reply message
  const promptReply = parsePromptReply(message.content);

  // Debug: log every message
  console.log('[Bubble] message.content:', message.content?.substring(0, 50), 'promptReply:', !!promptReply);

  // Render prompt reply card
  if (promptReply) {
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 20).duration(DURATION.fast)}
        style={[styles.row, isMine ? styles.rowRight : styles.rowLeft, styles.rowGap]}
      >
        {!isMine && (
          showAvatar ? (
            message.sender?.avatar ? (
              <Image source={{ uri: message.sender.avatar }} style={styles.bubbleAvatar} />
            ) : (
              <View style={[styles.bubbleAvatar, styles.bubbleAvatarPlaceholder, { backgroundColor: theme.bg.elevated }]}>
                <Ionicons name="person" size={12} color={theme.text.muted} />
              </View>
            )
          ) : (
            <View style={styles.bubbleAvatarSpacer} />
          )
        )}

        <View style={[styles.bubbleContent, styles.promptReplyBubbleContent]}>
          {/* Prompt Reply Card */}
          <View
            style={[
              styles.promptReplyCard,
              {
                backgroundColor: isMine ? theme.brand.primary : theme.bg.elevated,
                borderColor: isMine ? 'transparent' : theme.border.subtle,
              },
            ]}
          >
            {/* Quoted prompt section */}
            <View
              style={[
                styles.promptReplyQuote,
                {
                  backgroundColor: isMine ? 'rgba(255,255,255,0.15)' : theme.bg.surface,
                },
              ]}
            >
              <View
                style={[
                  styles.promptReplyQuoteBar,
                  { backgroundColor: isMine ? 'rgba(255,255,255,0.5)' : theme.brand.primary },
                ]}
              />
              <View style={styles.promptReplyQuoteContent}>
                <View style={styles.promptReplyQuoteHeader}>
                  <MaterialCommunityIcons
                    name="format-quote-open"
                    size={12}
                    color={isMine ? 'rgba(255,255,255,0.7)' : theme.text.muted}
                  />
                  <Text
                    style={[
                      styles.promptReplyQuoteQuestion,
                      { color: isMine ? 'rgba(255,255,255,0.7)' : theme.text.muted },
                    ]}
                    numberOfLines={1}
                  >
                    {promptReply.prompt.question}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.promptReplyQuoteAnswer,
                    { color: isMine ? 'rgba(255,255,255,0.85)' : theme.text.secondary },
                  ]}
                  numberOfLines={2}
                >
                  {promptReply.prompt.answer}
                </Text>
              </View>
            </View>

            {/* Reply text */}
            <Text style={[styles.promptReplyText, { color: isMine ? '#FFFFFF' : theme.text.primary }]}>
              {promptReply.reply}
            </Text>
          </View>

          {/* Timestamp */}
          <Text style={[styles.timestamp, isMine ? styles.timestampRight : styles.timestampLeft, { color: theme.text.muted }]}>
            {time}
          </Text>
        </View>
      </Animated.View>
    );
  }

  // Regular message bubble
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 20).duration(DURATION.fast)}
      style={[styles.row, isMine ? styles.rowRight : styles.rowLeft, isLast ? styles.rowGap : styles.rowTight]}
    >
      {!isMine && (
        showAvatar ? (
          message.sender?.avatar ? (
            <Image source={{ uri: message.sender.avatar }} style={styles.bubbleAvatar} />
          ) : (
            <View style={[styles.bubbleAvatar, styles.bubbleAvatarPlaceholder, { backgroundColor: theme.bg.elevated }]}>
              <Ionicons name="person" size={12} color={theme.text.muted} />
            </View>
          )
        ) : (
          <View style={styles.bubbleAvatarSpacer} />
        )
      )}

      <View style={styles.bubbleContent}>
        <View
          style={[
            styles.bubble,
            isMine
              ? [styles.bubbleMine, { backgroundColor: theme.brand.primary }]
              : [styles.bubbleOther, { backgroundColor: theme.bg.elevated }],
            isMine && isLast && styles.bubbleMineTail,
            !isMine && isLast && styles.bubbleOtherTail,
          ]}
        >
          <Text style={[styles.bubbleText, { color: isMine ? '#FFFFFF' : theme.text.primary }]}>
            {message.content}
          </Text>
        </View>
        {isLast && (
          <Text style={[styles.timestamp, isMine ? styles.timestampRight : styles.timestampLeft, { color: theme.text.muted }]}>
            {time}
          </Text>
        )}
      </View>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════
// ICEBREAKER CHIP
// ═══════════════════════════════════════════════════════════════

interface IcebreakerChipProps {
  text: string;
  onPress: () => void;
  index: number;
}

const IcebreakerChip: React.FC<IcebreakerChipProps> = ({ text, onPress, index }) => {
  const { theme } = useDatingTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, SPRING.snappy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING.snappy);
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(DURATION.normal)}
      style={animatedStyle}
    >
      <TouchableOpacity
        style={[styles.icebreaker, { backgroundColor: theme.bg.elevated, borderColor: theme.border.subtle }]}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Text style={[styles.icebreakerText, { color: theme.text.primary }]}>{text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// INNER COMPONENT
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// PROMPT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════

interface PromptCardProps {
  prompt: { question: string; answer: string };
  onPress: () => void;
  index: number;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onPress, index }) => {
  const { theme } = useDatingTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, SPRING.snappy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING.snappy);
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(400 + index * 100).duration(DURATION.normal)}
      style={animatedStyle}
    >
      <TouchableOpacity
        style={[styles.promptCard, { backgroundColor: theme.bg.surface, borderColor: theme.border.subtle }]}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <View style={styles.promptCardHeader}>
          <MaterialCommunityIcons name="format-quote-open" size={16} color={theme.brand.primary} />
          <Text style={[styles.promptCardQuestion, { color: theme.text.muted }]} numberOfLines={1}>
            {prompt.question}
          </Text>
        </View>
        <Text style={[styles.promptCardAnswer, { color: theme.text.primary }]} numberOfLines={2}>
          {prompt.answer}
        </Text>
        <View style={styles.promptCardHint}>
          <MaterialCommunityIcons name="message-reply-text" size={14} color={theme.brand.primary} />
          <Text style={[styles.promptCardHintText, { color: theme.brand.primary }]}>
            Nhấn để trả lời
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// INNER COMPONENT
// ═══════════════════════════════════════════════════════════════

const ChatRoomInner: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteParams>();
  const { theme } = useDatingTheme();
  const queryClient = useQueryClient();
  const me = useAuthStore((st) => st.user);
  const listRef = useRef<FlatList>(null);
  const [text, setText] = useState('');

  const { conversationId, otherUser, prefillMessage } = route.params as any;
  const queryKey = ['dating', 'chat', 'messages', conversationId] as const;

  // Pre-fill message if passed from profile detail (prompt reply)
  useEffect(() => {
    if (prefillMessage) {
      setText(prefillMessage);
    }
  }, [prefillMessage]);

  // Fetch other user's profile with prompts
  const { data: otherProfile } = useQuery({
    queryKey: ['dating', 'profile', otherUser?.id],
    queryFn: () => datingService.getProfileByUserId(otherUser!.id),
    enabled: !!otherUser?.id,
  });

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => datingChatService.getMessages(conversationId),
    enabled: !!conversationId,
  });
  const messages = data?.messages ?? [];

  const enrichedMessages = useMemo(
    () =>
      messages.map((m, i) => ({
        message: m,
        isMine: m.senderId === me?.id,
        showAvatar: !messages[i - 1] || messages[i - 1].senderId !== m.senderId,
        isLast: !messages[i + 1] || messages[i + 1].senderId !== m.senderId,
      })),
    [messages, me?.id],
  );

  useEffect(() => {
    const unsubscribe = socketService.onNewMessage((incoming: any) => {
      if (incoming.conversationId !== conversationId || incoming.senderId === me?.id) return;
      const newMessage: DatingMessage = {
        id: incoming.id,
        content: incoming.content,
        senderId: incoming.senderId,
        createdAt: incoming.createdAt,
        sender: incoming.sender,
      };
      queryClient.setQueryData(queryKey, (old: any) => {
        const existing = old?.messages ?? [];
        if (existing.some((x: DatingMessage) => x.id === newMessage.id)) return old;
        return { ...old, messages: [...existing, newMessage] };
      });
      queryClient.invalidateQueries({ queryKey: ['dating', 'chat', 'conversations'] });
    });
    return unsubscribe;
  }, [conversationId, me?.id, queryClient]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => datingChatService.sendMessage(conversationId, content),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => ({
        ...old,
        messages: [
          ...(old?.messages ?? []),
          {
            id: `temp-${Date.now()}`,
            content,
            senderId: me?.id ?? '',
            createdAt: new Date().toISOString(),
            sender: { id: me?.id ?? '', fullName: me?.fullName ?? '', avatar: me?.avatar ?? null },
          },
        ],
      }));
      return { previous };
    },
    onError: (_err, _content, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['dating', 'chat', 'conversations'] });
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText('');
    sendMutation.mutate(trimmed);
  }, [text, sendMutation]);

  const handleGoProfile = useCallback(async () => {
    if (!otherUser?.id) return;
    try {
      const profile = await datingService.getProfileByUserId(otherUser.id);
      navigation.navigate('DatingProfileDetail', {
        profile: {
          userId: otherUser.id,
          bio: profile.bio ?? '',
          photos: profile.photos ?? [],
          prompts: profile.prompts?.map((x: any) => ({ question: x.question, answer: x.answer })),
          user: {
            id: profile.user?.id ?? otherUser.id,
            fullName: profile.user?.fullName ?? otherUser.fullName,
            avatar: profile.user?.avatar ?? otherUser.avatar,
            dateOfBirth: profile.user?.dateOfBirth ?? '',
            gender: profile.user?.gender ?? null,
          },
          lifestyle: profile.lifestyle ?? null,
        } as any,
      });
    } catch {
      // silent
    }
  }, [navigation, otherUser]);

  const renderMessage = useCallback(
    ({ item, index }: { item: (typeof enrichedMessages)[0]; index: number }) => (
      <Bubble
        message={item.message}
        isMine={item.isMine}
        showAvatar={item.showAvatar}
        isLast={item.isLast}
        index={index}
      />
    ),
    [],
  );

  const isEmpty = messages.length === 0 && !isLoading;
  const firstName = otherUser?.fullName?.split(' ').pop() ?? 'bạn ấy';

  // Get prompts from the other user's profile
  const otherPrompts = useMemo(
    () => otherProfile?.prompts?.slice(0, 3) ?? [],
    [otherProfile?.prompts],
  );

  const icebreakers = useMemo(
    () => [
      `Chào ${firstName}! 👋`,
      'Mình rất vui được match với bạn!',
      'Bạn đang học ngành gì vậy? 📚',
      'Cuối tuần này bạn có rảnh không? ☕',
    ],
    [firstName],
  );

  // Handle prompt click - create a reply message
  const handlePromptPress = useCallback((prompt: { question: string; answer: string }) => {
    setText(`Về "${prompt.question.replace('...', '')}" - ${prompt.answer.slice(0, 50)}${prompt.answer.length > 50 ? '...' : ''} 👀\n\n`);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border.subtle }]}>
          <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color={theme.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerCenter} activeOpacity={0.7} onPress={handleGoProfile}>
            <View style={styles.headerAvatarWrap}>
              {otherUser?.avatar ? (
                <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatar} />
              ) : (
                <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder, { backgroundColor: theme.bg.elevated }]}>
                  <Ionicons name="person" size={18} color={theme.text.muted} />
                </View>
              )}
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { color: theme.text.primary }]} numberOfLines={1}>
                {otherUser?.fullName ?? 'Nguoi dung'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerAction} onPress={handleGoProfile}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color={theme.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={theme.brand.primary} />
            </View>
          ) : isEmpty ? (
            <View style={styles.emptyContainer}>
              <TouchableOpacity activeOpacity={0.85} onPress={handleGoProfile}>
                <Animated.View entering={FadeIn.duration(DURATION.normal)} style={[styles.emptyAvatarRing, { borderColor: theme.brand.primaryMuted }]}>
                  {otherUser?.avatar ? (
                    <Image source={{ uri: otherUser.avatar }} style={styles.emptyAvatar} />
                  ) : (
                    <View style={[styles.emptyAvatar, styles.emptyAvatarPlaceholder, { backgroundColor: theme.bg.elevated }]}>
                      <Ionicons name="person" size={40} color={theme.text.muted} />
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>

              <Animated.View entering={FadeIn.delay(100).duration(DURATION.normal)} style={[styles.matchBadge, { backgroundColor: theme.brand.primary }]}>
                <MaterialCommunityIcons name="heart" size={12} color="#FFFFFF" />
                <Text style={styles.matchBadgeText}>Da match</Text>
              </Animated.View>

              <Animated.Text entering={FadeIn.delay(200).duration(DURATION.normal)} style={[styles.emptyTitle, { color: theme.text.primary }]}>
                Bat dau tro chuyen voi {firstName}
              </Animated.Text>
              <Animated.Text entering={FadeIn.delay(300).duration(DURATION.normal)} style={[styles.emptySubtitle, { color: theme.text.muted }]}>
                {otherPrompts.length > 0
                  ? `Hãy bắt đầu từ những điều ${firstName} chia sẻ!`
                  : 'Đừng ngại, hãy gửi lời chào đầu tiên nhé!'}
              </Animated.Text>

              {/* Show other user's prompts if available */}
              {otherPrompts.length > 0 && (
                <View style={styles.promptsContainer}>
                  <Animated.Text
                    entering={FadeIn.delay(350).duration(DURATION.normal)}
                    style={[styles.promptsTitle, { color: theme.text.secondary }]}
                  >
                    Câu trả lời của {firstName}
                  </Animated.Text>
                  {otherPrompts.map((prompt: any, i: number) => (
                    <PromptCard
                      key={`${prompt.question}-${i}`}
                      prompt={prompt}
                      onPress={() => handlePromptPress(prompt)}
                      index={i}
                    />
                  ))}
                </View>
              )}

              {/* Fallback icebreakers if no prompts */}
              {otherPrompts.length === 0 && (
                <View style={styles.icebreakersContainer}>
                  {icebreakers.map((ice, i) => (
                    <IcebreakerChip key={ice} text={ice} onPress={() => setText(ice)} index={i} />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={enrichedMessages}
              keyExtractor={(item) => item.message.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Animated.View entering={FadeIn.duration(DURATION.normal)} style={styles.chatTopBanner}>
                  <TouchableOpacity activeOpacity={0.85} onPress={handleGoProfile}>
                    {otherUser?.avatar ? (
                      <Image source={{ uri: otherUser.avatar }} style={styles.bannerAvatar} />
                    ) : (
                      <View style={[styles.bannerAvatar, styles.emptyAvatarPlaceholder, { backgroundColor: theme.bg.elevated }]}>
                        <Ionicons name="person" size={20} color={theme.text.muted} />
                      </View>
                    )}
                  </TouchableOpacity>
                  <Text style={[styles.bannerText, { color: theme.text.muted }]}>
                    Ban da match voi {otherUser?.fullName ?? 'nguoi nay'}
                  </Text>
                  <TouchableOpacity onPress={handleGoProfile}>
                    <Text style={[styles.bannerLink, { color: theme.brand.primary }]}>Xem ho so</Text>
                  </TouchableOpacity>
                </Animated.View>
              }
            />
          )}

          {/* Input Bar */}
          <View style={[styles.inputBar, { backgroundColor: theme.bg.base, borderTopColor: theme.border.subtle }]}>
            <View style={[styles.inputRow, { backgroundColor: theme.bg.surface }]}>
              <TextInput
                style={[styles.input, { color: theme.text.primary }]}
                value={text}
                onChangeText={setText}
                placeholder="Nhap tin nhan..."
                placeholderTextColor={theme.text.muted}
                multiline
                maxLength={2000}
              />
              {text.trim() ? (
                <TouchableOpacity
                  style={[styles.sendButton, { backgroundColor: theme.brand.primary }]}
                  onPress={handleSend}
                  activeOpacity={0.8}
                >
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.heartButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setText('❤️');
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="heart" size={22} color={theme.brand.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const DatingChatRoomScreen: React.FC = () => {
  return (
    <DatingThemeProvider>
      <ChatRoomInner />
    </DatingThemeProvider>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

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
    height: 56,
    paddingHorizontal: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBack: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginLeft: SPACING.xxs,
  },
  headerAvatarWrap: {
    position: 'relative',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerName: {
    ...TEXT_STYLES.labelLarge,
  },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Body
  body: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Message list
  messageList: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
  },

  // Chat top banner
  chatTopBanner: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  bannerAvatar: {
    width: AVATAR.lg,
    height: AVATAR.lg,
    borderRadius: AVATAR.lg / 2,
    marginBottom: SPACING.sm,
  },
  bannerText: {
    ...TEXT_STYLES.bodySmall,
    textAlign: 'center',
    marginBottom: SPACING.xxs,
  },
  bannerLink: {
    ...TEXT_STYLES.labelSmall,
  },

  // Message rows
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  rowGap: {
    marginBottom: SPACING.sm,
  },
  rowTight: {
    marginBottom: 2,
  },

  bubbleAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: SPACING.xs,
  },
  bubbleAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleAvatarSpacer: {
    width: 34,
  },

  // Bubbles
  bubbleContent: {
    maxWidth: '76%',
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
  },
  bubbleMine: {},
  bubbleOther: {},
  bubbleMineTail: {
    borderBottomRightRadius: RADIUS.xs,
  },
  bubbleOtherTail: {
    borderBottomLeftRadius: RADIUS.xs,
  },
  bubbleText: {
    ...TEXT_STYLES.bodyMedium,
    lineHeight: 21,
  },

  timestamp: {
    ...TEXT_STYLES.tiny,
    marginTop: SPACING.xxs,
  },
  timestampLeft: {
    marginLeft: SPACING.xxs,
  },
  timestampRight: {
    textAlign: 'right',
    marginRight: SPACING.xxs,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyAvatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyAvatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  emptyAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  matchBadgeText: {
    ...TEXT_STYLES.labelSmall,
    color: '#FFFFFF',
  },
  emptyTitle: {
    ...TEXT_STYLES.headingMedium,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...TEXT_STYLES.bodyMedium,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },

  // Prompts section
  promptsContainer: {
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  promptsTitle: {
    ...TEXT_STYLES.labelMedium,
    marginBottom: SPACING.xs,
  },
  promptCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  promptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  promptCardQuestion: {
    ...TEXT_STYLES.labelSmall,
    flex: 1,
  },
  promptCardAnswer: {
    ...TEXT_STYLES.bodyMedium,
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  promptCardHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  promptCardHintText: {
    ...TEXT_STYLES.tiny,
  },

  // Icebreakers
  icebreakersContainer: {
    width: '100%',
    gap: SPACING.sm,
  },
  icebreaker: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
  },
  icebreakerText: {
    ...TEXT_STYLES.bodyMedium,
    textAlign: 'center',
  },

  // Input bar
  inputBar: {
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xs : SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    minHeight: 44,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.xxs,
  },
  input: {
    flex: 1,
    ...TEXT_STYLES.bodyMedium,
    maxHeight: 100,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Prompt Reply Bubble
  promptReplyBubbleContent: {
    maxWidth: '85%',
  },
  promptReplyCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  promptReplyQuote: {
    flexDirection: 'row',
    padding: SPACING.xs,
  },
  promptReplyQuoteBar: {
    width: 3,
    borderRadius: 2,
    marginRight: SPACING.xs,
  },
  promptReplyQuoteContent: {
    flex: 1,
  },
  promptReplyQuoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    marginBottom: 2,
  },
  promptReplyQuoteQuestion: {
    ...TEXT_STYLES.tiny,
    flex: 1,
  },
  promptReplyQuoteAnswer: {
    ...TEXT_STYLES.bodySmall,
    lineHeight: 16,
  },
  promptReplyText: {
    ...TEXT_STYLES.bodyMedium,
    lineHeight: 21,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
});

export default DatingChatRoomScreen;
