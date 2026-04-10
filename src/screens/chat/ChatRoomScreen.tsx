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
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Message, User, Conversation, RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/slices/authSlice';
import { chatService } from '../../services/chat/chatService';

type ChatRoomScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatRoom'>;
type ChatRoomScreenRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;

const ChatRoomScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
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

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = isOwnMessage(item);
    const showAvatar = shouldShowAvatar(item, index);
    const showTime = shouldShowTime(item, index);
    const sender = isOwn ? user : item.sender;

    return (
      <View>
        {showTime && (
          <Text style={styles.timeLabel}>{formatMessageTime(item.createdAt)}</Text>
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

          <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
            {item.type === 'image' && item.media?.[0] && (
              <TouchableOpacity activeOpacity={0.9}>
                <Image
                  source={{ uri: item.media[0].url }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            {item.content && (
              <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                {item.content}
              </Text>
            )}
          </View>

          {isOwn && (
            <View style={styles.statusContainer}>
              {item.status === 'sending' && (
                <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
              )}
              {item.status === 'sent' && (
                <Ionicons name="checkmark" size={14} color={Colors.textTertiary} />
              )}
              {item.status === 'delivered' && (
                <Ionicons name="checkmark-done" size={14} color={Colors.textTertiary} />
              )}
              {item.status === 'read' && (
                <Ionicons name="checkmark-done" size={14} color={Colors.primary} />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading || !conversation) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đang tải...</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={Colors.textPrimary} />
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
            {isPrivate && otherParticipant?.isOnline && <View style={styles.onlineDot} />}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{chatName}</Text>
            {isPrivate && (
              <Text style={[styles.headerStatus, otherParticipant?.isOnline && styles.headerStatusOnline]}>
                {otherParticipant?.isOnline ? 'Đang hoạt động' : 'Offline'}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="call-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="videocam-outline" size={24} color={Colors.textPrimary} />
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
            <Text style={styles.typingText}>đang nhập...</Text>
          </View>
        )}

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
          <TouchableOpacity style={styles.attachButton} onPress={handleAttachment}>
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </TouchableOpacity>

          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={Colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity style={styles.emojiButton}>
              <Ionicons name="happy-outline" size={22} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {inputText.trim() ? (
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Ionicons name="send" size={20} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micButton}>
              <Ionicons name="mic" size={24} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    borderBottomColor: Colors.gray100,
    backgroundColor: Colors.white,
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
    color: Colors.textPrimary,
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
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  headerInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  headerName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  headerStatus: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  headerStatusOnline: {
    color: Colors.success,
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
    color: Colors.textTertiary,
    textAlign: 'center',
    marginVertical: Spacing.md,
    backgroundColor: Colors.gray100,
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
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Colors.gray100,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    lineHeight: 22,
  },
  ownMessageText: {
    color: Colors.white,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.md,
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
    color: Colors.textTertiary,
    marginLeft: Spacing.xs,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.gray100,
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
    color: Colors.textPrimary,
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
    backgroundColor: Colors.primary,
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
});

export default ChatRoomScreen;
