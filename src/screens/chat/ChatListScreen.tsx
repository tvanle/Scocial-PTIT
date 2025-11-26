import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Header, IconButton } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Conversation } from '../../types';
import { formatTimeAgo } from '../../utils/dateUtils';

// Mock data
const mockConversations: Conversation[] = [
  {
    id: '1',
    type: 'private',
    participants: [
      { id: '2', fullName: 'Trần Văn B', avatar: 'https://i.pravatar.cc/150?img=2', email: '', createdAt: '', updatedAt: '' },
    ],
    lastMessage: {
      id: '1',
      conversationId: '1',
      sender: { id: '2', fullName: 'Trần Văn B', avatar: 'https://i.pravatar.cc/150?img=2', email: '', createdAt: '', updatedAt: '' },
      content: 'Bạn có rảnh không? Mình muốn hỏi về bài tập lập trình.',
      type: 'text',
      status: 'delivered',
      readBy: [],
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    unreadCount: 2,
    isOnline: true,
    isMuted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'private',
    participants: [
      { id: '3', fullName: 'Lê Thị C', avatar: 'https://i.pravatar.cc/150?img=3', email: '', createdAt: '', updatedAt: '' },
    ],
    lastMessage: {
      id: '2',
      conversationId: '2',
      sender: { id: '1', fullName: 'You', avatar: '', email: '', createdAt: '', updatedAt: '' },
      content: 'Ok, mai gặp nhé!',
      type: 'text',
      status: 'read',
      readBy: ['3'],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    unreadCount: 0,
    isOnline: false,
    isMuted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'group',
    name: 'Nhóm D21CQCN01-B',
    avatar: 'https://i.pravatar.cc/150?img=50',
    participants: [
      { id: '2', fullName: 'Trần Văn B', avatar: '', email: '', createdAt: '', updatedAt: '' },
      { id: '3', fullName: 'Lê Thị C', avatar: '', email: '', createdAt: '', updatedAt: '' },
      { id: '4', fullName: 'Phạm Văn D', avatar: '', email: '', createdAt: '', updatedAt: '' },
    ],
    lastMessage: {
      id: '3',
      conversationId: '3',
      sender: { id: '4', fullName: 'Phạm Văn D', avatar: '', email: '', createdAt: '', updatedAt: '' },
      content: 'Ai đã làm bài tập chương 5 chưa?',
      type: 'text',
      status: 'delivered',
      readBy: [],
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    unreadCount: 5,
    isMuted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    type: 'private',
    participants: [
      { id: '5', fullName: 'Nguyễn Thị E', avatar: 'https://i.pravatar.cc/150?img=5', email: '', createdAt: '', updatedAt: '' },
    ],
    lastMessage: {
      id: '4',
      conversationId: '4',
      sender: { id: '5', fullName: 'Nguyễn Thị E', avatar: '', email: '', createdAt: '', updatedAt: '' },
      content: '📷 Đã gửi một ảnh',
      type: 'image',
      status: 'delivered',
      readBy: [],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    unreadCount: 0,
    isOnline: true,
    isMuted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface ChatListScreenProps {
  navigation: any;
}

const ChatListScreen: React.FC<ChatListScreenProps> = ({ navigation }) => {
  const [conversations, setConversations] = useState(mockConversations);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  }, []);

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('ChatRoom', { conversationId: conversation.id });
  };

  const handleNewChat = () => {
    navigation.navigate('NewChat');
  };

  const getConversationName = (conversation: Conversation): string => {
    if (conversation.type === 'group') {
      return conversation.name || 'Nhóm chat';
    }
    return conversation.participants[0]?.fullName || 'Unknown';
  };

  const getConversationAvatar = (conversation: Conversation): string | undefined => {
    if (conversation.type === 'group') {
      return conversation.avatar;
    }
    return conversation.participants[0]?.avatar;
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item }: { item: Conversation }) => {
    const name = getConversationName(item);
    const avatar = getConversationAvatar(item);
    const isOnline = item.type === 'private' && item.isOnline;
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <Avatar
          uri={avatar}
          name={name}
          size="lg"
          showOnlineStatus={item.type === 'private'}
          isOnline={isOnline}
        />

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameContainer}>
              <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>
                {name}
              </Text>
              {item.isMuted && (
                <Ionicons name="volume-mute" size={14} color={Colors.textTertiary} style={styles.muteIcon} />
              )}
            </View>
            <Text style={[styles.time, hasUnread && styles.timeUnread]}>
              {formatTimeAgo(item.lastMessage?.createdAt || item.updatedAt)}
            </Text>
          </View>

          <View style={styles.messageRow}>
            <Text
              style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
              numberOfLines={1}
            >
              {item.type === 'group' && item.lastMessage?.sender.id !== '1' && (
                <Text style={styles.senderName}>{item.lastMessage?.sender.fullName}: </Text>
              )}
              {item.lastMessage?.content || 'Bắt đầu cuộc trò chuyện'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title={Strings.nav.messages}
        rightComponent={
          <View style={styles.headerRight}>
            <IconButton
              icon="create-outline"
              onPress={handleNewChat}
              variant="ghost"
              size={36}
              iconSize={24}
            />
          </View>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={Strings.search.placeholder}
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Online Friends */}
      <View style={styles.onlineSection}>
        <Text style={styles.onlineTitle}>Đang hoạt động</Text>
        <FlatList
          horizontal
          data={conversations.filter(c => c.type === 'private' && c.isOnline)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.onlineItem}
              onPress={() => handleConversationPress(item)}
            >
              <Avatar
                uri={item.participants[0]?.avatar}
                name={item.participants[0]?.fullName || ''}
                size="md"
                showOnlineStatus
                isOnline
              />
              <Text style={styles.onlineName} numberOfLines={1}>
                {item.participants[0]?.fullName?.split(' ').pop()}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => `online-${item.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.onlineList}
        />
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRight: {
    flexDirection: 'row',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  onlineSection: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  onlineTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  onlineList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  onlineItem: {
    alignItems: 'center',
    width: 60,
  },
  onlineName: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    width: 60,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  conversationContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  nameUnread: {
    fontWeight: FontWeight.bold,
  },
  muteIcon: {
    marginLeft: Spacing.xs,
  },
  time: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  timeUnread: {
    color: Colors.primary,
    fontWeight: FontWeight.semiBold,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginRight: Spacing.sm,
  },
  lastMessageUnread: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  senderName: {
    fontWeight: FontWeight.medium,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  unreadText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
  },
});

export default ChatListScreen;
