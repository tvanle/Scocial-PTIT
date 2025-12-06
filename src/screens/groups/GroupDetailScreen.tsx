import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import PostCard from '../../components/home/PostCard';
import { Post } from '../../types';

const { width } = Dimensions.get('window');

interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
}

interface GroupPost extends Post {
  isPinned?: boolean;
}

const GroupDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'members'>('posts');
  const [isMember, setIsMember] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data
  const group = {
    id: '1',
    name: 'PTIT - Sinh viên Học viện Công nghệ Bưu chính Viễn thông',
    description: 'Cộng đồng sinh viên PTIT, nơi chia sẻ kiến thức, kinh nghiệm học tập và các hoạt động của trường.',
    coverPhoto: 'https://picsum.photos/800/300',
    avatar: 'https://picsum.photos/200',
    privacy: 'PUBLIC',
    membersCount: 15420,
    postsCount: 8234,
    rules: [
      'Tôn trọng mọi thành viên trong nhóm',
      'Không spam, quảng cáo trái phép',
      'Nội dung phải liên quan đến sinh viên PTIT',
      'Không đăng nội dung vi phạm pháp luật',
    ],
    createdAt: '2020-01-15',
  };

  const members: GroupMember[] = [
    { id: '1', name: 'Nguyễn Văn A', avatar: 'https://i.pravatar.cc/150?img=1', role: 'OWNER' },
    { id: '2', name: 'Trần Thị B', avatar: 'https://i.pravatar.cc/150?img=2', role: 'ADMIN' },
    { id: '3', name: 'Lê Văn C', avatar: 'https://i.pravatar.cc/150?img=3', role: 'MODERATOR' },
    { id: '4', name: 'Phạm Thị D', avatar: 'https://i.pravatar.cc/150?img=4', role: 'MEMBER' },
    { id: '5', name: 'Hoàng Văn E', avatar: 'https://i.pravatar.cc/150?img=5', role: 'MEMBER' },
  ];

  const posts: GroupPost[] = [
    {
      id: '1',
      author: { id: '1', email: 'admin@ptit.edu.vn', fullName: 'Admin PTIT', avatar: 'https://i.pravatar.cc/150?img=1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      content: '📢 THÔNG BÁO: Lịch thi học kỳ 1 năm học 2024-2025 đã được cập nhật. Các bạn sinh viên vui lòng kiểm tra trên cổng thông tin sinh viên.',
      likesCount: 234,
      commentsCount: 45,
      sharesCount: 12,
      privacy: 'public',
      isLiked: false,
      isSaved: false,
      isShared: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      isPinned: true,
    },
    {
      id: '2',
      author: { id: '2', email: 'tranb@ptit.edu.vn', fullName: 'Trần Thị B', avatar: 'https://i.pravatar.cc/150?img=2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      content: 'Có ai có tài liệu môn Cấu trúc dữ liệu và giải thuật không ạ? Em cần gấp 🙏',
      likesCount: 15,
      commentsCount: 23,
      sharesCount: 0,
      privacy: 'public',
      isLiked: false,
      isSaved: false,
      isShared: false,
      createdAt: '2024-01-15T09:30:00Z',
      updatedAt: '2024-01-15T09:30:00Z',
    },
    {
      id: '3',
      author: { id: '3', email: 'lec@ptit.edu.vn', fullName: 'Lê Văn C', avatar: 'https://i.pravatar.cc/150?img=3', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      content: 'Chia sẻ kinh nghiệm phỏng vấn intern tại các công ty IT cho các bạn sinh viên năm 3, năm 4.',
      media: [{ id: '1', url: 'https://picsum.photos/400/300', type: 'image' }],
      likesCount: 156,
      commentsCount: 67,
      sharesCount: 8,
      privacy: 'public',
      isLiked: true,
      isSaved: false,
      isShared: false,
      createdAt: '2024-01-14T15:00:00Z',
      updatedAt: '2024-01-14T15:00:00Z',
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const handleJoinGroup = () => {
    setIsMember(!isMember);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return { text: 'Quản trị viên', color: colors.primary };
      case 'ADMIN':
        return { text: 'Admin', color: colors.info };
      case 'MODERATOR':
        return { text: 'Moderator', color: colors.success };
      default:
        return null;
    }
  };

  const renderHeader = () => (
    <View>
      {/* Cover Photo */}
      <View style={styles.coverContainer}>
        <Image source={{ uri: group.coverPhoto }} style={styles.coverPhoto} />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Group Info */}
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.name}</Text>

        <View style={styles.groupMeta}>
          <View style={styles.metaItem}>
            <Ionicons
              name={group.privacy === 'PUBLIC' ? 'globe-outline' : 'lock-closed-outline'}
              size={16}
              color={colors.text.secondary}
            />
            <Text style={styles.metaText}>
              {group.privacy === 'PUBLIC' ? 'Nhóm công khai' : 'Nhóm riêng tư'}
            </Text>
          </View>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{group.membersCount.toLocaleString()} thành viên</Text>
        </View>

        {/* Member Avatars */}
        <View style={styles.memberAvatars}>
          {members.slice(0, 5).map((member, index) => (
            <View key={member.id} style={[styles.memberAvatar, { marginLeft: index > 0 ? -10 : 0 }]}>
              <Avatar uri={member.avatar} size={32} />
            </View>
          ))}
          <Text style={styles.memberText}>
            và {(group.membersCount - 5).toLocaleString()} người khác
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title={isMember ? 'Đã tham gia' : 'Tham gia nhóm'}
            onPress={handleJoinGroup}
            variant={isMember ? 'outline' : 'primary'}
            size="medium"
            icon={isMember ? 'checkmark' : 'add'}
            style={{ flex: 1 }}
          />
          <TouchableOpacity style={styles.inviteButton}>
            <Ionicons name="person-add" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-social" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
            Bài viết
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'about' && styles.tabActive]}
          onPress={() => setActiveTab('about')}
        >
          <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
            Giới thiệu
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.tabActive]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
            Thành viên
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAbout = () => (
    <View style={styles.aboutSection}>
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>Giới thiệu</Text>
        <Text style={styles.aboutDescription}>{group.description}</Text>

        <View style={styles.aboutItem}>
          <Ionicons name="globe-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.aboutItemText}>Nhóm công khai</Text>
        </View>

        <View style={styles.aboutItem}>
          <Ionicons name="eye-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.aboutItemText}>Hiển thị với mọi người</Text>
        </View>

        <View style={styles.aboutItem}>
          <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.aboutItemText}>
            Được tạo ngày {new Date(group.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>

      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>Quy định nhóm</Text>
        {group.rules.map((rule, index) => (
          <View key={index} style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>{index + 1}</Text>
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderMembers = () => (
    <View style={styles.membersSection}>
      <View style={styles.membersHeader}>
        <Text style={styles.membersTitle}>
          Thành viên · {group.membersCount.toLocaleString()}
        </Text>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {members.map((member) => {
        const badge = getRoleBadge(member.role);
        return (
          <TouchableOpacity key={member.id} style={styles.memberItem}>
            <Avatar uri={member.avatar} size={48} />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              {badge && (
                <View style={[styles.roleBadge, { backgroundColor: badge.color + '20' }]}>
                  <Text style={[styles.roleBadgeText, { color: badge.color }]}>
                    {badge.text}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.memberAction}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.viewAllButton}>
        <Text style={styles.viewAllText}>Xem tất cả thành viên</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPosts = () => (
    <View style={styles.postsSection}>
      {/* Create Post Box */}
      {isMember && (
        <TouchableOpacity style={styles.createPostBox}>
          <Avatar uri="https://i.pravatar.cc/150?img=3" size={40} />
          <View style={styles.createPostInput}>
            <Text style={styles.createPostPlaceholder}>Viết bài đăng...</Text>
          </View>
          <TouchableOpacity style={styles.createPostMedia}>
            <Ionicons name="images" size={24} color={colors.success} />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Posts */}
      {posts.map((post) => (
        <View key={post.id} style={styles.postWrapper}>
          {post.isPinned && (
            <View style={styles.pinnedBadge}>
              <Ionicons name="pin" size={14} color={colors.primary} />
              <Text style={styles.pinnedText}>Bài viết ghim</Text>
            </View>
          )}
          <PostCard post={post} />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {renderHeader()}

        {activeTab === 'posts' && renderPosts()}
        {activeTab === 'about' && renderAbout()}
        {activeTab === 'members' && renderMembers()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  coverContainer: {
    position: 'relative',
  },
  coverPhoto: {
    width: width,
    height: 200,
  },
  backButton: {
    position: 'absolute',
    top: 44,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    position: 'absolute',
    top: 44,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupName: {
    ...typography.h2,
    color: colors.text.primary,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  metaDot: {
    color: colors.text.secondary,
    marginHorizontal: spacing.xs,
  },
  memberAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  memberAvatar: {
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 16,
  },
  memberText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  inviteButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  postsSection: {
    paddingBottom: spacing.lg,
  },
  createPostBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  createPostInput: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginLeft: spacing.sm,
  },
  createPostPlaceholder: {
    ...typography.body,
    color: colors.text.placeholder,
  },
  createPostMedia: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  postWrapper: {
    marginBottom: spacing.sm,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: 4,
  },
  pinnedText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  aboutSection: {
    padding: spacing.md,
  },
  aboutCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  aboutTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  aboutDescription: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  aboutItemText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  ruleItem: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  ruleNumber: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    width: 20,
  },
  ruleText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  membersSection: {
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  membersTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  memberName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    marginTop: 2,
  },
  roleBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  memberAction: {
    padding: spacing.xs,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  viewAllText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default GroupDetailScreen;
