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
import { Avatar, Header, IconButton } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
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
      Alert.alert('Lỗi', 'Không thể tải danh sách trò chuyện. Vui lòng thử lại.');
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

  if (loading) {
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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

      {/* Online Users */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatListScreen;
