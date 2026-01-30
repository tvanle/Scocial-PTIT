import React, { useState, useCallback, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Avatar, Header, IconButton } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Message, User } from '../../types';
import { useAuthStore } from '../../store/slices/authSlice';

// Mock chat partner
const mockPartner: User = {
  id: '2',
  fullName: 'Trần Văn B',
  avatar: 'https://i.pravatar.cc/150?img=2',
  email: '',
  isOnline: true,
  createdAt: '',
  updatedAt: '',
};

// Mock messages
const mockMessages: Message[] = [
  {
    id: '1',
    conversationId: '1',
    sender: mockPartner,
    content: 'Chào bạn! Mình là B, học cùng lớp CNTT nhé!',
    type: 'text',
    status: 'read',
    readBy: ['1'],
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    conversationId: '1',
    sender: { id: '1', fullName: 'Me', email: '', createdAt: '', updatedAt: '' },
    content: 'Chào bạn! Mình nhớ rồi, cùng nhóm project hôm trước đúng không?',
    type: 'text',
    status: 'read',
    readBy: ['2'],
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    conversationId: '1',
    sender: mockPartner,
    content: 'Đúng rồi! Bạn có rảnh tối nay không? Mình muốn hỏi về phần database của project.',
    type: 'text',
    status: 'read',
    readBy: ['1'],
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    conversationId: '1',
    sender: { id: '1', fullName: 'Me', email: '', createdAt: '', updatedAt: '' },
    content: 'Được chứ! Khoảng 8h tối nhé, mình rảnh.',
    type: 'text',
    status: 'read',
    readBy: ['2'],
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    conversationId: '1',
    sender: mockPartner,
    content: 'Ok, cảm ơn bạn nhiều! 🙏',
    type: 'text',
    status: 'read',
    readBy: ['1'],
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    conversationId: '1',
    sender: mockPartner,
    content: 'À mà bạn xem qua đoạn code này giúp mình với',
    type: 'text',
    status: 'delivered',
    readBy: [],
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    conversationId: '1',
    sender: mockPartner,
    media: [{ id: '1', url: 'https://picsum.photos/400/300?random=100', type: 'image' }],
    type: 'image',
    status: 'delivered',
    readBy: [],
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
];

interface ChatRoomScreenProps {
  navigation: any;
  route: any;
}

const ChatRoomScreen: React.FC<ChatRoomScreenProps> = ({ navigation, route }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState(mockMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      conversationId: '1',
      sender: { id: '1', fullName: 'Me', email: '', createdAt: '', updatedAt: '' },
      content: inputText.trim(),
      type: 'text',
      status: 'sending',
      readBy: [],
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [newMessage, ...prev]);
    setInputText('');

    // Simulate message sent
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => (m.id === newMessage.id ? { ...m, status: 'sent' } : m))
      );
    }, 500);
  }, [inputText]);

  const handleAttachment = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newMessage: Message = {
        id: Date.now().toString(),
        conversationId: '1',
        sender: { id: '1', fullName: 'Me', email: '', createdAt: '', updatedAt: '' },
        media: [{ id: Date.now().toString(), url: result.assets[0].uri, type: 'image' }],
        type: 'image',
        status: 'sent',
        readBy: [],
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [newMessage, ...prev]);
    }
  };

  const handleCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      const newMessage: Message = {
        id: Date.now().toString(),
        conversationId: '1',
        sender: { id: '1', fullName: 'Me', email: '', createdAt: '', updatedAt: '' },
        media: [{ id: Date.now().toString(), url: result.assets[0].uri, type: 'image' }],
        type: 'image',
        status: 'sent',
        readBy: [],
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [newMessage, ...prev]);
    }
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: Message): boolean => {
    return message.sender.id === '1' || message.sender.id === user?.id;
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

    return (
      <View>
        {showTime && (
          <Text style={styles.timeLabel}>{formatMessageTime(item.createdAt)}</Text>
        )}
        <View style={[styles.messageRow, isOwn && styles.ownMessageRow]}>
          {!isOwn && (
            <View style={styles.avatarContainer}>
              {showAvatar ? (
                <Avatar uri={mockPartner.avatar} name={mockPartner.fullName} size="sm" />
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        showBackButton
        onBackPress={() => navigation.goBack()}
        centerComponent={
          <TouchableOpacity style={styles.headerCenter} onPress={() => navigation.navigate('UserProfile' as never, { userId: mockPartner.id } as never)}>
            <Avatar uri={mockPartner.avatar} name={mockPartner.fullName} size="sm" showOnlineStatus isOnline />
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{mockPartner.fullName}</Text>
              <Text style={styles.headerStatus}>
                {mockPartner.isOnline ? Strings.chat.online : Strings.chat.offline}
              </Text>
            </View>
          </TouchableOpacity>
        }
        rightComponent={
          <View style={styles.headerRight}>
            <IconButton
              icon="call-outline"
              onPress={() => Alert.alert('Goi dien', 'Tinh nang goi dien dang phat trien')}
              variant="ghost"
              size={36}
              iconSize={22}
            />
            <IconButton
              icon="videocam-outline"
              onPress={() => Alert.alert('Goi video', 'Tinh nang goi video dang phat trien')}
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
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messageList}
        />

        {isTyping && (
          <View style={styles.typingIndicator}>
            <Avatar uri={mockPartner.avatar} name={mockPartner.fullName} size="xs" />
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
});

export default ChatRoomScreen;
