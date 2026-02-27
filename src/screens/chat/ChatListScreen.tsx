import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Conversation } from '../../types';
import { formatTimeAgo } from '../../utils/dateUtils';
import { chatService } from '../../services/chat/chatService';

interface ChatListScreenProps {
  navigation: any;
}

const ChatListScreen: React.FC<ChatListScreenProps> = ({ navigation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = async () => {
    try {
      const response = await chatService.getConversations({ page: 1, limit: 50 });
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, []);

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('ChatRoom', { conversationId: conversation.id });
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
                <Ionicons name="volume-mute" size={14} color={Colors.textTertiary} style={{ marginLeft: 4 }} />
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
          <TouchableOpacity style={styles.newChatButton}>
            <Ionicons name="create-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <TouchableOpacity style={styles.newChatButton}>
          <Ionicons name="create-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm cuộc trò chuyện"
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Online Users */}
      {conversations.filter(c => c.type === 'private' && c.isOnline).length > 0 && (
        <View style={styles.onlineSection}>
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
      )}

      {/* Conversations */}
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
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>Chưa có tin nhắn</Text>
            <Text style={styles.emptyText}>Bắt đầu trò chuyện với bạn bè</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Layout.headerHeight,
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
  },
  newChatButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  onlineSection: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  onlineList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  onlineItem: {
    alignItems: 'center',
    width: 56,
  },
  onlineName: {
    fontSize: FontSize.xxs,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    width: 56,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: Spacing.sm,
    paddingBottom: 100,
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
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatListScreen;
