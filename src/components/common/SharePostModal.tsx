import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useTheme } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../store/slices/authSlice';
import { userService } from '../../services/user/userService';
import { chatService } from '../../services/chat/chatService';
import { User } from '../../types';
import { DEFAULT_AVATAR } from '../../constants/strings';

interface SharePostModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postAuthorName: string;
  postContent?: string;
}

const SharePostModal: React.FC<SharePostModalProps> = ({
  visible,
  onClose,
  postId,
  postAuthorName,
  postContent,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user: currentUser } = useAuthStore();

  const [following, setFollowing] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch following list
  useEffect(() => {
    if (visible && currentUser?.id) {
      fetchFollowing();
    }
  }, [visible, currentUser?.id]);

  const fetchFollowing = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const response = await userService.getFollowing(currentUser.id, { page: 1, limit: 50 });
      setFollowing(response.data || []);
      setFilteredUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch following:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(following);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        following.filter(
          (user) =>
            user.fullName?.toLowerCase().includes(query) ||
            user.studentId?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, following]);

  const toggleUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const handleSend = async () => {
    if (selectedUsers.size === 0) return;

    setSending(true);
    try {
      // Create post link message
      const postLink = `[Bài viết] ptit.social/post/${postId}`;
      const fullMessage = message.trim()
        ? `${message.trim()}\n\n${postLink}`
        : postLink;

      // Send to each selected user
      const promises = Array.from(selectedUsers).map(async (userId) => {
        try {
          const conversation = await chatService.getOrCreateConversation(userId);
          await chatService.sendMessage(conversation.id, {
            content: message.trim() || `Đã chia sẻ một bài viết`,
            type: 'text',
            postId: postId,
          });
        } catch (error) {
          console.error(`Failed to send to user ${userId}:`, error);
        }
      });

      await Promise.all(promises);

      // Reset and close
      setSelectedUsers(new Set());
      setMessage('');
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Failed to share post:', error);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers(new Set());
    setMessage('');
    setSearchQuery('');
    onClose();
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: colors.cardBackground }]}
        onPress={() => toggleUser(item.id)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.avatar || DEFAULT_AVATAR }}
          style={[styles.avatar, { backgroundColor: colors.gray200 }]}
        />
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {item.fullName}
            </Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color={colors.verified} style={{ marginLeft: 4 }} />
            )}
          </View>
          {item.studentId && (
            <Text style={[styles.userHandle, { color: colors.textTertiary }]}>
              {item.studentId}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.checkbox,
            { borderColor: isSelected ? colors.primary : colors.gray300 },
            isSelected && { backgroundColor: colors.primary },
          ]}
        >
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderLight, paddingTop: insets.top || Spacing.md }]}>
          <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Chia sẻ bài viết
          </Text>
          <TouchableOpacity
            onPress={handleSend}
            disabled={selectedUsers.size === 0 || sending}
            style={styles.headerBtn}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text
                style={[
                  styles.sendText,
                  { color: selectedUsers.size > 0 ? colors.primary : colors.gray300 },
                ]}
              >
                Gửi
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Post Preview */}
        <View style={[styles.postPreview, { backgroundColor: colors.gray100, borderColor: colors.borderLight }]}>
          <Ionicons name="document-text-outline" size={20} color={colors.textTertiary} />
          <View style={styles.postPreviewText}>
            <Text style={[styles.postPreviewAuthor, { color: colors.textPrimary }]} numberOfLines={1}>
              Bài viết của {postAuthorName}
            </Text>
            {postContent && (
              <Text style={[styles.postPreviewContent, { color: colors.textSecondary }]} numberOfLines={1}>
                {postContent}
              </Text>
            )}
          </View>
        </View>

        {/* Message Input */}
        <View style={[styles.messageInput, { borderBottomColor: colors.borderLight }]}>
          <TextInput
            style={[styles.messageTextInput, { color: colors.textPrimary }]}
            placeholder="Thêm tin nhắn..."
            placeholderTextColor={colors.textTertiary}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={200}
          />
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.gray100 }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Tìm kiếm..."
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

        {/* Selected count */}
        {selectedUsers.size > 0 && (
          <View style={[styles.selectedBar, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.selectedText, { color: colors.primary }]}>
              Đã chọn {selectedUsers.size} người
            </Text>
          </View>
        )}

        {/* User List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.gray300} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {searchQuery ? 'Không tìm thấy người dùng' : 'Bạn chưa theo dõi ai'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  sendText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  postPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  postPreviewText: {
    flex: 1,
  },
  postPreviewAuthor: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  postPreviewContent: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  messageInput: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  messageTextInput: {
    fontSize: FontSize.md,
    maxHeight: 80,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
  },
  selectedBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  selectedText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  userHandle: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
  },
});

export default SharePostModal;
