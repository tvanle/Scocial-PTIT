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
import { useTheme } from '../../hooks/useThemeColors';
import { Conversation } from '../../types';
import { formatTimeAgo } from '../../utils/dateUtils';
import { chatService } from '../../services/chat/chatService';
import { useFetch } from '../../hooks';

interface ChatListScreenProps {
  navigation: any;
}

const ChatListScreen: React.FC<ChatListScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
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
          <View style={[styles.onlineIndicator, { borderColor: colors.background, backgroundColor: colors.success }]} />
        </View>
        <Text style={[styles.onlineUserName, { color: colors.textSecondary }]} numberOfLines={1}>{firstName}</Text>
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
          {isPrivate && isOnline && <View style={[styles.onlineDot, { borderColor: colors.background, backgroundColor: colors.success }]} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.name, { color: colors.textPrimary }, hasUnread && styles.nameUnread]} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.timeRow}>
              {item.isMuted && (
                <Ionicons name="volume-mute" size={12} color={colors.textTertiary} style={{ marginRight: 4 }} />
              )}
              <Text style={[styles.time, { color: colors.textTertiary }, hasUnread && { color: colors.primary }]}>
                {formatTimeAgo(item.lastMessage?.createdAt || item.updatedAt)}
              </Text>
            </View>
          </View>

          <View style={styles.messageRow}>
            <Text
              style={[styles.lastMessage, { color: colors.textTertiary }, hasUnread && { color: colors.textPrimary, fontWeight: FontWeight.medium }]}
              numberOfLines={1}
            >
              {item.lastMessage?.content || 'Bắt đầu cuộc trò chuyện'}
            </Text>
            {hasUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.unreadText, { color: colors.white }]}>
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
        <View style={[styles.onlineSection, { borderBottomColor: colors.gray200 }]}>
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
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Tin nhắn</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Nhắn tin</Text>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.gray100 }]}>
            <Ionicons name="create-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Nhắn tin</Text>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.gray100 }]}>
          <Ionicons name="create-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.gray100 }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Tìm kiếm"
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
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
            colors={[colors.primary]}
            tintColor={colors.primary}
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
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 40,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    height: '100%',
  },
  onlineSection: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
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
    borderWidth: 2,
  },
  onlineUserName: {
    fontSize: FontSize.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
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
    borderWidth: 2,
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
  },
  timeUnread: {
    fontWeight: FontWeight.medium,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: FontSize.sm,
    marginRight: Spacing.sm,
  },
  lastMessageUnread: {
    fontWeight: FontWeight.medium,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatListScreen;
