import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, SearchInput, EmptyState } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, Layout } from '../../constants/theme';
import { Conversation } from '../../types';
import { formatTimeAgo } from '../../utils/dateUtils';
import { chatService } from '../../services/chat/chatService';
import { useFetch } from '../../hooks';

interface ChatListScreenProps {
  navigation: any;
}

const ChatListScreen: React.FC<ChatListScreenProps> = ({ navigation }) => {
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
        <Avatar
          uri={avatar}
          name={name}
          size="lg"
          showOnlineStatus={isPrivate}
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
          <Text style={styles.headerTitle}>Messages</Text>
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
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newChatButton}>
          <Ionicons name="create-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Tìm kiếm cuộc trò chuyện"
      />

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatListScreen;
