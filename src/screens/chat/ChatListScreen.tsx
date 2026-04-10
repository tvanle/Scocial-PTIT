import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, EmptyState } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Conversation } from '../../types';
import { formatTimeAgo } from '../../utils/dateUtils';
import { chatService } from '../../services/chat/chatService';
import { useFetch } from '../../hooks';

interface ChatListScreenProps {
  navigation: any;
}

const ChatListScreen: React.FC<ChatListScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { data: conversationsData, loading, refreshing, onRefresh } = useFetch(
    useCallback(() => chatService.getConversations({ page: 1, limit: 50 }), []),
  );
  const conversations = conversationsData?.data || [];
  const [searchQuery, setSearchQuery] = useState('');

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('ChatRoom', { conversationId: conversation.id });
  };

  const getConversationName = (conversation: Conversation): string => {
    if (conversation.type.toLowerCase() === 'group') {
      return conversation.name || 'Nhóm chat';
    }
    return conversation.participants[0]?.fullName || 'Unknown';
  };

  const getConversationAvatar = (conversation: Conversation): string | undefined => {
    if (conversation.type.toLowerCase() === 'group') {
      return conversation.avatar;
    }
    return conversation.participants[0]?.avatar;
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get online users for the horizontal list
  const onlineUsers = conversations
    .filter(conv => conv.type.toLowerCase() === 'private' && conv.isOnline)
    .slice(0, 10);

  const renderOnlineUser = (conversation: Conversation, index: number) => {
    const name = getConversationName(conversation);
    const avatar = getConversationAvatar(conversation);
    const firstName = name.split(' ').pop() || name;

    return (
      <TouchableOpacity
        key={conversation.id}
        style={[styles.onlineUserItem, index === 0 && { marginLeft: Spacing.lg }]}
        onPress={() => handleConversationPress(conversation)}
        activeOpacity={0.7}
      >
        <View style={styles.onlineAvatarWrapper}>
          <Avatar uri={avatar} name={name} size="lg" />
          <View style={styles.onlineIndicator} />
        </View>
        <Text style={styles.onlineUserName} numberOfLines={1}>{firstName}</Text>
      </TouchableOpacity>
    );
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const name = getConversationName(item);
    const avatar = getConversationAvatar(item);
    const isOnline = item.type.toLowerCase() === 'private' && item.isOnline;
    const hasUnread = item.unreadCount > 0;
    const isPrivate = item.type.toLowerCase() === 'private';

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrapper}>
          <Avatar uri={avatar} name={name} size="lg" />
          {isPrivate && isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.timeRow}>
              {item.isMuted && (
                <Ionicons name="volume-mute" size={12} color={Colors.textTertiary} style={{ marginRight: 4 }} />
              )}
              <Text style={[styles.time, hasUnread && styles.timeUnread]}>
                {formatTimeAgo(item.lastMessage?.createdAt || item.updatedAt)}
              </Text>
            </View>
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

  const ListHeader = () => (
    <View>
      {/* Online Users Section */}
      {onlineUsers.length > 0 && (
        <View style={styles.onlineSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.onlineList}
          >
            {onlineUsers.map((conv, index) => renderOnlineUser(conv, index))}
          </ScrollView>
        </View>
      )}

      {/* Section Title */}
      <Text style={styles.sectionTitle}>Tin nhắn</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nhắn tin</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="create-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nhắn tin</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="create-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm"
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

      {/* Conversations */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
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
        removeClippedSubviews
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
        ListEmptyComponent={
          <EmptyState
            icon="chatbox-outline"
            title="Chưa có tin nhắn"
            subtitle="Bắt đầu trò chuyện với bạn bè"
          />
        }
      />
    </View>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.gray100,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 40,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    height: '100%',
  },
  onlineSection: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  onlineList: {
    paddingRight: Spacing.lg,
  },
  onlineUserItem: {
    alignItems: 'center',
    marginRight: Spacing.md,
    width: 64,
  },
  onlineAvatarWrapper: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  onlineUserName: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  listContent: {
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
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
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  nameUnread: {
    fontWeight: FontWeight.bold,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  timeUnread: {
    color: Colors.primary,
    fontWeight: FontWeight.medium,
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
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatListScreen;
