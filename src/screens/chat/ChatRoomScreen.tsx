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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Avatar, Header, IconButton } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Message, User, Conversation, RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/slices/authSlice';
import { chatService } from '../../services/chat/chatService';

type ChatRoomScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatRoom'>;
type ChatRoomScreenRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;

const ChatRoomScreen: React.FC = () => {
  const navigation = useNavigation<ChatRoomScreenNavigationProp>();
  const route = useRoute<ChatRoomScreenRouteProp>();
  const { conversationId } = route.params;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchData = async () => {
    try {
      const [convData, messagesData] = await Promise.all([
        chatService.getConversation(conversationId),
        chatService.getMessages(conversationId, { page: 1, limit: 50 }),
      ]);
      setConversation(convData);
      setMessages(messagesData.data.reverse());

      // Mark as read
      await chatService.markAsRead(conversationId);
    } catch (error) {
      console.error('Failed to fetch chat data:', error);
      Alert.alert('Lỗi', 'Không thể tải cuộc trò chuyện. Vui lòng thử lại.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [conversationId]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;

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
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  }, [inputText, conversationId, user]);

  const handleAttachment = async () => {
    Alert.alert('Đính kèm', 'Tính năng đính kèm file đang phát triển');
  };

  const handleCamera = async () => {
    Alert.alert('Camera', 'Tính năng camera đang phát triển');
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: Message): boolean => {
    return message.sender.id === user?.id;
  };

  const getOtherParticipant = (): User | null => {
    if (!conversation || conversation.type !== 'private') return null;
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          showBackButton
          onBackPress={() => navigation.goBack()}
          title="Đang tải..."
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const otherParticipant = getOtherParticipant();
  const chatName = conversation.type === 'group'
    ? conversation.name || 'Nhóm chat'
    : otherParticipant?.fullName || 'Unknown';
  const chatAvatar = conversation.type === 'group'
    ? conversation.avatar
    : otherParticipant?.avatar;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        showBackButton
        onBackPress={() => navigation.goBack()}
        centerComponent={
          <TouchableOpacity
            style={styles.headerCenter}
            onPress={() => {
              if (conversation.type === 'private' && otherParticipant) {
                navigation.navigate('UserProfile', { userId: otherParticipant.id });
              }
            }}
          >
            <Avatar
              uri={chatAvatar}
              name={chatName}
              size="sm"
              showOnlineStatus={conversation.type === 'private'}
              isOnline={conversation.type === 'private' ? otherParticipant?.isOnline : false}
            />
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{chatName}</Text>
              {conversation.type === 'private' && (
                <Text style={styles.headerStatus}>
                  {otherParticipant?.isOnline ? Strings.chat.online : Strings.chat.offline}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        }
        rightComponent={
          <View style={styles.headerRight}>
            <IconButton
              icon="call-outline"
              onPress={() => Alert.alert('Gọi điện', 'Tính năng gọi điện đang phát triển')}
              variant="ghost"
              size={36}
              iconSize={22}
            />
            <IconButton
              icon="videocam-outline"
              onPress={() => Alert.alert('Gọi video', 'Tính năng gọi video đang phát triển')}
              variant="ghost"
              size={36}
              iconSize={22}
            />
          </View>
        }
      />

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

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={handleAttachment}>
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.cameraButton} onPress={handleCamera}>
            <Ionicons name="camera" size={24} color={Colors.primary} />
          </TouchableOpacity>

          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={Strings.chat.typeMessage}
              placeholderTextColor={Colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity style={styles.emojiButton}>
              <Ionicons name="happy-outline" size={24} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {inputText.trim() ? (
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Ionicons name="send" size={22} color={Colors.textLight} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micButton}>
              <Ionicons name="mic" size={24} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: Spacing.sm,
  },
  headerName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  headerStatus: {
    fontSize: FontSize.xs,
    color: Colors.success,
  },
  headerRight: {
    flexDirection: 'row',
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
    maxWidth: '70%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  ownBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: BorderRadius.xs,
  },
  otherBubble: {
    backgroundColor: Colors.backgroundSecondary,
    borderBottomLeftRadius: BorderRadius.xs,
  },
  messageText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    padding: Spacing.md,
    lineHeight: 20,
  },
  ownMessageText: {
    color: Colors.textLight,
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
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  attachButton: {
    padding: Spacing.xs,
  },
  cameraButton: {
    padding: Spacing.xs,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.round,
    marginHorizontal: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.xs,
    maxHeight: 80,
  },
  emojiButton: {
    padding: Spacing.xs,
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
    padding: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatRoomScreen;
