import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  StatusBar,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Avatar } from '../../components/common';
import { DEFAULT_AVATAR } from '../../constants/strings';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useTheme } from '../../hooks/useThemeColors';
import { Message, User, Conversation, RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/slices/authSlice';
import { chatService } from '../../services/chat/chatService';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import VoiceMessage from '../../components/chat/VoiceMessage';

type ChatRoomScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatRoom'>;
type ChatRoomScreenRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;

const ChatRoomScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<ChatRoomScreenNavigationProp>();
  const route = useRoute<ChatRoomScreenRouteProp>();
  const { conversationId: routeConversationId, userId } = route.params;
  const { user } = useAuthStore();
  const [conversationId, setConversationId] = useState<string | null>(routeConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Voice recorder
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  const fetchData = async () => {
    try {
      let convId = conversationId;
      let convData: Conversation | null = null;

      if (!convId && userId) {
        const conv = await chatService.getOrCreateConversation(userId);
        convId = conv.id;
        convData = conv;
        setConversationId(convId);
      }

      if (!convId) {
        throw new Error('No conversation ID or user ID provided');
      }

      // Only fetch conversation if we don't already have it from getOrCreate
      const [fetchedConv, messagesData] = await Promise.all([
        convData ? Promise.resolve(convData) : chatService.getConversation(convId),
        chatService.getMessages(convId, { page: 1, limit: 50 }),
      ]);
      setConversation(fetchedConv);
      setMessages(messagesData.data);

      await chatService.markAsRead(convId);
    } catch (error) {
      console.error('Failed to fetch chat data:', error);
      showAlert('Lỗi', 'Không thể tải cuộc trò chuyện. Vui lòng thử lại.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [routeConversationId, userId]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !conversationId) return;

    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      conversationId,
      sender: user!,
      content: inputText.trim(),
      type: 'text',
      status: 'sending',
      readBy: [],
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    try {
      const sentMessage = await chatService.sendMessage(conversationId, {
        content: inputText.trim(),
        type: 'text',
      });

      setMessages(prev =>
        prev.map(m => (m.id === tempId ? sentMessage : m))
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      showAlert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  }, [inputText, conversationId, user]);

  const handleAttachment = async () => {
    showAlert('Đính kèm', 'Tính năng đính kèm file đang phát triển');
  };

  // Voice recording handlers
  const handleStartRecording = useCallback(async () => {
    await startRecording();
  }, [startRecording]);

  const handleStopAndSend = useCallback(async () => {
    const duration = recordingDuration;
    const uri = await stopRecording();

    if (uri && conversationId && duration >= 1) {
      // Send voice message
      const tempId = Date.now().toString();
      const newMessage: Message = {
        id: tempId,
        conversationId,
        sender: user!,
        content: `${duration}`,
        type: 'audio',
        status: 'sending',
        readBy: [],
        createdAt: new Date().toISOString(),
        mediaUrl: uri,
      };

      setMessages(prev => [...prev, newMessage]);

      try {
        const sentMessage = await chatService.sendVoiceMessage(conversationId, uri, duration);
        setMessages(prev =>
          prev.map(m => (m.id === tempId ? sentMessage : m))
        );
      } catch (error) {
        console.error('Failed to send voice message:', error);
        setMessages(prev => prev.filter(m => m.id !== tempId));
        showAlert('Lỗi', 'Không thể gửi tin nhắn thoại');
      }
    }
  }, [stopRecording, conversationId, recordingDuration, user]);

  const handleCancelRecording = useCallback(async () => {
    await cancelRecording();
  }, [cancelRecording]);

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: Message): boolean => {
    return message.sender.id === user?.id;
  };

  const getOtherParticipant = (): User | null => {
    if (!conversation || conversation.type.toLowerCase() !== 'private') return null;
    return conversation.participants.find(p => p.id !== user?.id) || null;
  };

  const shouldShowAvatar = (message: Message, index: number): boolean => {
    if (isOwnMessage(message)) return false;
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    return prevMessage.sender.id !== message.sender.id;
  };

  const shouldShowTime = (message: Message, index: number): boolean => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentTime = new Date(message.createdAt).getTime();
    const prevTime = new Date(prevMessage.createdAt).getTime();
    return currentTime - prevTime > 5 * 60 * 1000; // 5 minutes
  };

  const renderSharedPost = (message: Message, isOwn: boolean) => {
    const post = message.sharedPost;
    if (!post) return null;

    // Handle both formats: likesCount/commentsCount or _count.likes/_count.comments
    const postData = post as any;
    const likesCount = postData.likesCount ?? postData._count?.likes ?? 0;
    const commentsCount = postData.commentsCount ?? postData._count?.comments ?? 0;

    return (
      <TouchableOpacity
        style={[
          styles.sharedPostCard,
          { backgroundColor: isOwn ? 'rgba(255,255,255,0.15)' : colors.background, borderColor: isOwn ? 'rgba(255,255,255,0.2)' : colors.borderLight },
        ]}
        onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
        activeOpacity={0.8}
      >
        {/* Post Author */}
        <View style={styles.sharedPostHeader}>
          <Image
            source={{ uri: post.author?.avatar || DEFAULT_AVATAR }}
            style={styles.sharedPostAvatar}
          />
          <Text style={[styles.sharedPostAuthor, { color: isOwn ? colors.white : colors.textPrimary }]} numberOfLines={1}>
            {post.author?.fullName || 'Unknown'}
          </Text>
          {post.author?.isVerified && (
            <Ionicons name="checkmark-circle" size={12} color={colors.verified} style={{ marginLeft: 2 }} />
          )}
        </View>

        {/* Post Content */}
        {post.content && (
          <Text style={[styles.sharedPostContent, { color: isOwn ? 'rgba(255,255,255,0.9)' : colors.textSecondary }]} numberOfLines={2}>
            {post.content}
          </Text>
        )}

        {/* Post Media */}
        {post.media && post.media.length > 0 && (
          <Image
            source={{ uri: post.media[0].url }}
            style={styles.sharedPostImage}
            resizeMode="cover"
          />
        )}

        {/* Post Stats */}
        <View style={styles.sharedPostStats}>
          <View style={styles.sharedPostStat}>
            <Ionicons name="heart-outline" size={12} color={isOwn ? 'rgba(255,255,255,0.7)' : colors.textTertiary} />
            <Text style={[styles.sharedPostStatText, { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
              {likesCount}
            </Text>
          </View>
          <View style={styles.sharedPostStat}>
            <Ionicons name="chatbubble-outline" size={12} color={isOwn ? 'rgba(255,255,255,0.7)' : colors.textTertiary} />
            <Text style={[styles.sharedPostStatText, { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
              {commentsCount}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = isOwnMessage(item);
    const showAvatar = shouldShowAvatar(item, index);
    const showTime = shouldShowTime(item, index);
    const sender = isOwn ? user : item.sender;
    const isPostMessage = !!item.sharedPost;

    return (
      <View>
        {showTime && (
          <Text style={[styles.timeLabel, { color: colors.textTertiary, backgroundColor: colors.gray100 }]}>{formatMessageTime(item.createdAt)}</Text>
        )}
        <View style={[styles.messageRow, isOwn && styles.ownMessageRow]}>
          {!isOwn && (
            <View style={styles.avatarContainer}>
              {showAvatar ? (
                <Avatar uri={sender?.avatar} name={sender?.fullName || ''} size="sm" />
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
            </View>
          )}

          <View style={[
            styles.messageBubble,
            isOwn ? [styles.ownBubble, { backgroundColor: colors.primary }] : [styles.otherBubble, { backgroundColor: colors.gray100 }],
            isPostMessage && styles.postMessageBubble,
          ]}>
            {/* Shared Post Card */}
            {isPostMessage && renderSharedPost(item, isOwn)}

            {/* Image Message */}
            {item.type === 'image' && item.media?.[0] && (
              <TouchableOpacity activeOpacity={0.9}>
                <Image
                  source={{ uri: item.media[0].url }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}

            {/* Voice Message */}
            {item.type.toLowerCase() === 'audio' && item.mediaUrl && (
              <VoiceMessage
                uri={item.mediaUrl}
                duration={item.content ? parseInt(item.content, 10) : undefined}
                isOwn={isOwn}
                colors={colors}
              />
            )}

            {/* Text Content (show if not a post/audio message) */}
            {item.content && !isPostMessage && item.type.toLowerCase() !== 'audio' && (
              <Text style={[styles.messageText, { color: isOwn ? colors.white : colors.textPrimary }]}>
                {item.content}
              </Text>
            )}
          </View>

          {isOwn && (
            <View style={styles.statusContainer}>
              {item.status === 'sending' && (
                <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
              )}
              {item.status === 'sent' && (
                <Ionicons name="checkmark" size={14} color={colors.textTertiary} />
              )}
              {item.status === 'delivered' && (
                <Ionicons name="checkmark-done" size={14} color={colors.textTertiary} />
              )}
              {item.status === 'read' && (
                <Ionicons name="checkmark-done" size={14} color={colors.primary} />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading || !conversation) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={[styles.header, { borderBottomColor: colors.gray200, backgroundColor: colors.background }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Đang tải...</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const otherParticipant = getOtherParticipant();
  const isPrivate = conversation.type.toLowerCase() === 'private';
  const chatName = !isPrivate
    ? conversation.name || 'Nhóm chat'
    : otherParticipant?.fullName || 'Unknown';
  const chatAvatar = !isPrivate
    ? conversation.avatar
    : otherParticipant?.avatar;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Custom Header */}
      <View style={[styles.header, { borderBottomColor: colors.gray200, backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => {
            if (isPrivate && otherParticipant) {
              navigation.navigate('UserProfile', { userId: otherParticipant.id });
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.headerAvatarWrapper}>
            <Avatar uri={chatAvatar} name={chatName} size="sm" />
            {isPrivate && otherParticipant?.isOnline && <View style={[styles.onlineDot, { borderColor: colors.background }]} />}
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: colors.textPrimary }]} numberOfLines={1}>{chatName}</Text>
            {isPrivate && (
              <Text style={[styles.headerStatus, { color: otherParticipant?.isOnline ? colors.success : colors.textTertiary }]}>
                {otherParticipant?.isOnline ? 'Đang hoạt động' : 'Offline'}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="call-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="videocam-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isTyping && otherParticipant && (
          <View style={styles.typingIndicator}>
            <Avatar uri={otherParticipant.avatar} name={otherParticipant.fullName} size="xs" />
            <Text style={[styles.typingText, { color: colors.textTertiary }]}>đang nhập...</Text>
          </View>
        )}

        {/* Recording UI */}
        {isRecording ? (
          <View style={[styles.recordingContainer, { paddingBottom: Math.max(insets.bottom, Spacing.sm), borderTopColor: colors.gray200, backgroundColor: colors.background }]}>
            <TouchableOpacity style={[styles.cancelRecordButton, { backgroundColor: colors.gray200 }]} onPress={handleCancelRecording}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>

            <View style={styles.recordingInfo}>
              <View style={[styles.recordingDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.recordingTime, { color: colors.error }]}>
                {formatRecordingTime(recordingDuration)}
              </Text>
              <Text style={[styles.recordingLabel, { color: colors.textSecondary }]}>Đang ghi âm...</Text>
            </View>

            <TouchableOpacity style={[styles.sendRecordButton, { backgroundColor: colors.primary }]} onPress={handleStopAndSend}>
              <Ionicons name="send" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, Spacing.sm), borderTopColor: colors.gray200, backgroundColor: colors.background }]}>
            <TouchableOpacity style={styles.attachButton} onPress={handleAttachment}>
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </TouchableOpacity>

            <View style={[styles.textInputContainer, { backgroundColor: colors.gray100 }]}>
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="Nhập tin nhắn..."
                placeholderTextColor={colors.textTertiary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity style={styles.emojiButton}>
                <Ionicons name="happy-outline" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {inputText.trim() ? (
              <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.primary }]} onPress={handleSend}>
                <Ionicons name="send" size={20} color={colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.micButton} onPress={handleStartRecording}>
                <Ionicons name="mic" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    textAlign: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarWrapper: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    // backgroundColor applied inline for theme support
  },
  headerInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  headerName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  headerStatus: {
    fontSize: FontSize.xs,
  },
  headerStatusOnline: {
    // Color applied inline for theme support
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  timeLabel: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginVertical: Spacing.md,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 2,
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: Spacing.xs,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    lineHeight: 22,
  },
  ownMessageText: {
    // Color applied inline for theme support
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.md,
  },
  postMessageBubble: {
    padding: Spacing.xs,
    maxWidth: '85%',
  },
  sharedPostCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 200,
  },
  sharedPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  sharedPostAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: Spacing.xs,
  },
  sharedPostAuthor: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    flex: 1,
  },
  sharedPostContent: {
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xs,
    lineHeight: 18,
  },
  sharedPostImage: {
    width: '100%',
    height: 120,
  },
  sharedPostStats: {
    flexDirection: 'row',
    padding: Spacing.sm,
    paddingTop: Spacing.xs,
    gap: Spacing.md,
  },
  sharedPostStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sharedPostStatText: {
    fontSize: FontSize.xs,
  },
  statusContainer: {
    marginLeft: Spacing.xs,
    marginBottom: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  typingText: {
    fontSize: FontSize.sm,
    marginLeft: Spacing.xs,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    marginHorizontal: Spacing.xs,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: 4,
    minHeight: 44,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
  },
  emojiButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  recordingTime: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    marginRight: Spacing.sm,
  },
  recordingLabel: {
    fontSize: FontSize.sm,
  },
  cancelRecordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendRecordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatRoomScreen;
