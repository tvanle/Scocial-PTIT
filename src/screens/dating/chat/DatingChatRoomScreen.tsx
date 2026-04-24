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
  Modal,
  Pressable,
  ScrollView,
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
                    size={14}
                    color={isMine ? 'rgba(255,255,255,0.7)' : theme.text.muted}
                  />
                  <Text
                    style={[
                      styles.promptReplyQuoteQuestion,
                      { color: isMine ? 'rgba(255,255,255,0.8)' : theme.text.secondary },
                    ]}
                    numberOfLines={2}
                  >
                    {promptReply.prompt.question}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.promptReplyQuoteAnswer,
                    { color: isMine ? 'rgba(255,255,255,0.9)' : theme.text.primary },
                  ]}
                  numberOfLines={3}
                >
                  "{promptReply.prompt.answer}"
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
  const [replyingToPrompt, setReplyingToPrompt] = useState<{ question: string; answer: string } | null>(null);
  const [showPromptsModal, setShowPromptsModal] = useState(false);
  const [tempMessages, setTempMessages] = useState<DatingMessage[]>([]);

  // Debug: log tempMessages changes
  useEffect(() => {
    console.log('[tempMessages] Changed, count:', tempMessages.length, tempMessages.map(m => m.id));
  }, [tempMessages]);

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

  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey,
    queryFn: () => datingChatService.getMessages(conversationId),
    enabled: !!conversationId,
  });

  // Combine server messages with temp messages
  const messages = useMemo(() => {
    const serverMessages = data?.messages ?? [];
    // Filter out temp messages that now exist on server (by content match)
    const serverContents = new Set(serverMessages.map((m: DatingMessage) => m.content));
    const pendingTemp = tempMessages.filter(m => !serverContents.has(m.content));
    console.log('[messages] server:', serverMessages.length, 'temp:', tempMessages.length, 'pending:', pendingTemp.length);
    return [...serverMessages, ...pendingTemp];
  }, [data?.messages, tempMessages, dataUpdatedAt]);

  const enrichedMessages = useMemo(() => {
    console.log('[enrichedMessages] Computing, messages count:', messages.length);
    return messages.map((m, i) => ({
      message: m,
      isMine: m.senderId === me?.id,
      showAvatar: !messages[i - 1] || messages[i - 1].senderId !== m.senderId,
      isLast: !messages[i + 1] || messages[i + 1].senderId !== m.senderId,
    }));
  }, [messages, me?.id]);

  useEffect(() => {
    const unsubscribe = socketService.onNewMessage((incoming: any) => {
      if (incoming.conversationId !== conversationId || incoming.senderId === me?.id) return;
      // Invalidate query to get new message from server
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['dating', 'chat', 'conversations'] });
    });
    return unsubscribe;
  }, [conversationId, me?.id, queryClient, queryKey]);

  // Track if sending to prevent double sends
  const [isSending, setIsSending] = useState(false);

  const handleSend = useCallback(() => {
    console.log('[handleSend] Called, text:', text, 'isSending:', isSending);
    const trimmed = text.trim();
    if (!trimmed || isSending) {
      console.log('[handleSend] Early return - trimmed:', trimmed, 'isSending:', isSending);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSending(true);
    console.log('[handleSend] Processing message...');

    let messageContent = trimmed;

    // If replying to a prompt, format as JSON
    if (replyingToPrompt) {
      messageContent = JSON.stringify({
        type: 'prompt_reply',
        prompt: {
          question: replyingToPrompt.question,
          answer: replyingToPrompt.answer,
        },
        reply: trimmed,
      });
      setReplyingToPrompt(null);
    }

    // Create temp message
    const tempId = `temp-${Date.now()}`;
    const tempMessage: DatingMessage = {
      id: tempId,
      content: messageContent,
      senderId: me?.id ?? '',
      createdAt: new Date().toISOString(),
      sender: { id: me?.id ?? '', fullName: me?.fullName ?? '', avatar: me?.avatar ?? null },
    };

    // Clear input first
    setText('');

    // Add to temp messages immediately for instant display
    setTempMessages(prev => [...prev, tempMessage]);
    console.log('[handleSend] Added temp message:', tempId);

    // Scroll to bottom
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);

    // Send to server
    datingChatService.sendMessage(conversationId, messageContent)
      .then(() => {
        console.log('[handleSend] Message sent successfully, refetching...');
        // Refetch to get server message with real ID
        return queryClient.invalidateQueries({ queryKey });
      })
      .then(() => {
        // Remove temp message after server data is loaded
        setTempMessages(prev => prev.filter(m => m.id !== tempId));
        console.log('[handleSend] Removed temp message:', tempId);
      })
      .catch((err) => {
        console.error('Failed to send message:', err);
        // Remove temp message on error
        setTempMessages(prev => prev.filter(m => m.id !== tempId));
      })
      .finally(() => {
        setIsSending(false);
        queryClient.invalidateQueries({ queryKey: ['dating', 'chat', 'conversations'] });
      });
  }, [text, isSending, replyingToPrompt, me, conversationId, queryClient, queryKey]);

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
  console.log('[Render] isEmpty:', isEmpty, 'messages:', messages.length, 'text:', text, 'replyingToPrompt:', !!replyingToPrompt);
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

  // Handle prompt click - set up reply mode
  const handlePromptPress = useCallback((prompt: { question: string; answer: string }) => {
    setReplyingToPrompt(prompt);
    setShowPromptsModal(false);
    setText('');
  }, []);

  // Cancel prompt reply
  const handleCancelPromptReply = useCallback(() => {
    setReplyingToPrompt(null);
    setText('');
  }, []);

  // Toggle prompts modal
  const handleTogglePromptsModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPromptsModal((prev) => !prev);
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
              extraData={[messages.length, tempMessages.length]}
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
            {/* Prompt Reply Preview */}
            {replyingToPrompt && (
              <View style={[styles.replyPreview, { backgroundColor: theme.bg.surface, borderColor: theme.border.subtle }]}>
                <View style={[styles.replyPreviewBar, { backgroundColor: theme.brand.primary }]} />
                <View style={styles.replyPreviewContent}>
                  <Text style={[styles.replyPreviewLabel, { color: theme.text.muted }]} numberOfLines={1}>
                    Tra loi: {replyingToPrompt.question}
                  </Text>
                  <Text style={[styles.replyPreviewText, { color: theme.text.secondary }]} numberOfLines={1}>
                    "{replyingToPrompt.answer}"
                  </Text>
                </View>
                <TouchableOpacity style={styles.replyPreviewClose} onPress={handleCancelPromptReply}>
                  <Ionicons name="close" size={18} color={theme.text.muted} />
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.inputRow, { backgroundColor: theme.bg.surface }]}>
              {/* Prompt button - show if other user has prompts */}
              {otherPrompts.length > 0 && !replyingToPrompt && (
                <TouchableOpacity
                  style={styles.promptButton}
                  onPress={handleTogglePromptsModal}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="format-quote-open" size={20} color={theme.brand.primary} />
                </TouchableOpacity>
              )}
              <TextInput
                style={[styles.input, { color: theme.text.primary }]}
                value={text}
                onChangeText={setText}
                placeholder={replyingToPrompt ? "Nhap phan hoi cua ban..." : "Nhap tin nhan..."}
                placeholderTextColor={theme.text.muted}
                multiline
                maxLength={2000}
              />
              {text.trim() ? (
                <TouchableOpacity
                  style={[styles.sendButton, { backgroundColor: theme.brand.primary }]}
                  onPress={() => {
                    console.log('[SendButton] Pressed!');
                    handleSend();
                  }}
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

      {/* Prompts Modal */}
      <Modal
        visible={showPromptsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPromptsModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPromptsModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.bg.base }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
              Tra loi cau hoi cua {firstName}
            </Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {otherPrompts.map((prompt: any, i: number) => (
                <TouchableOpacity
                  key={`modal-prompt-${i}`}
                  style={[styles.modalPromptCard, { backgroundColor: theme.bg.surface, borderColor: theme.border.subtle }]}
                  onPress={() => handlePromptPress(prompt)}
                  activeOpacity={0.8}
                >
                  <View style={styles.modalPromptHeader}>
                    <MaterialCommunityIcons name="format-quote-open" size={16} color={theme.brand.primary} />
                    <Text style={[styles.modalPromptQuestion, { color: theme.text.secondary }]}>
                      {prompt.question}
                    </Text>
                  </View>
                  <Text style={[styles.modalPromptAnswer, { color: theme.text.primary }]} numberOfLines={3}>
                    {prompt.answer}
                  </Text>
                  <View style={styles.modalPromptHint}>
                    <MaterialCommunityIcons name="message-reply-text" size={14} color={theme.brand.primary} />
                    <Text style={[styles.modalPromptHintText, { color: theme.brand.primary }]}>
                      Nhan de tra loi
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.xxs,
  },
  promptButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Reply Preview (above input)
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingRight: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  replyPreviewBar: {
    width: 3,
    alignSelf: 'stretch',
    marginRight: SPACING.sm,
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewLabel: {
    ...TEXT_STYLES.tiny,
    marginBottom: 2,
  },
  replyPreviewText: {
    ...TEXT_STYLES.bodySmall,
  },
  replyPreviewClose: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Prompt Reply Bubble
  promptReplyBubbleContent: {
    maxWidth: '88%',
    minWidth: 220,
  },
  promptReplyCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  promptReplyQuote: {
    flexDirection: 'row',
    padding: SPACING.sm,
  },
  promptReplyQuoteBar: {
    width: 3,
    borderRadius: 2,
    marginRight: SPACING.sm,
  },
  promptReplyQuoteContent: {
    flex: 1,
  },
  promptReplyQuoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    marginBottom: SPACING.xxs,
  },
  promptReplyQuoteQuestion: {
    ...TEXT_STYLES.labelSmall,
    flex: 1,
  },
  promptReplyQuoteAnswer: {
    ...TEXT_STYLES.bodySmall,
    lineHeight: 18,
  },
  promptReplyText: {
    ...TEXT_STYLES.bodyMedium,
    lineHeight: 21,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },

  // Prompts Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '70%',
    paddingBottom: SPACING.xl,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...TEXT_STYLES.headingSmall,
    textAlign: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  modalScroll: {
    paddingHorizontal: SPACING.md,
  },
  modalPromptCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  modalPromptHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  modalPromptQuestion: {
    ...TEXT_STYLES.labelMedium,
    flex: 1,
  },
  modalPromptAnswer: {
    ...TEXT_STYLES.bodyMedium,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  modalPromptHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  modalPromptHintText: {
    ...TEXT_STYLES.tiny,
  },
});

export default DatingChatRoomScreen;
