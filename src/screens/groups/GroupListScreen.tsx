import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import Button from '../../components/common/Button';

interface Group {
  id: string;
  name: string;
  coverPhoto: string;
  membersCount: number;
  privacy: 'PUBLIC' | 'PRIVATE' | 'SECRET';
  isMember: boolean;
  lastActivity?: string;
  postsToday?: number;
}

const GroupListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data
  const myGroups: Group[] = [
    {
      id: '1',
      name: 'PTIT - Sinh viên Học viện',
      coverPhoto: 'https://picsum.photos/400/200?random=1',
      membersCount: 15420,
      privacy: 'PUBLIC',
      isMember: true,
      lastActivity: '5 phút trước',
      postsToday: 23,
    },
    {
      id: '2',
      name: 'D20CQCN01 - PTIT',
      coverPhoto: 'https://picsum.photos/400/200?random=2',
      membersCount: 65,
      privacy: 'PRIVATE',
      isMember: true,
      lastActivity: '1 giờ trước',
      postsToday: 5,
    },
    {
      id: '3',
      name: 'CLB Tin học PTIT',
      coverPhoto: 'https://picsum.photos/400/200?random=3',
      membersCount: 1234,
      privacy: 'PUBLIC',
      isMember: true,
      lastActivity: '30 phút trước',
      postsToday: 12,
    },
  ];

  const discoverGroups: Group[] = [
    {
      id: '4',
      name: 'Cộng đồng lập trình viên PTIT',
      coverPhoto: 'https://picsum.photos/400/200?random=4',
      membersCount: 8756,
      privacy: 'PUBLIC',
      isMember: false,
    },
    {
      id: '5',
      name: 'Review đồ ăn quanh PTIT',
      coverPhoto: 'https://picsum.photos/400/200?random=5',
      membersCount: 5432,
      privacy: 'PUBLIC',
      isMember: false,
    },
    {
      id: '6',
      name: 'Tìm việc làm cho SV PTIT',
      coverPhoto: 'https://picsum.photos/400/200?random=6',
      membersCount: 12890,
      privacy: 'PUBLIC',
      isMember: false,
    },
    {
      id: '7',
      name: 'Chia sẻ tài liệu học tập PTIT',
      coverPhoto: 'https://picsum.photos/400/200?random=7',
      membersCount: 9876,
      privacy: 'PRIVATE',
      isMember: false,
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const renderGroupCard = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => navigation.navigate('GroupDetail' as never, { groupId: item.id } as never)}
    >
      <Image source={{ uri: item.coverPhoto }} style={styles.groupCover} />
      <View style={styles.groupContent}>
        <Text style={styles.groupName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.groupMeta}>
          <Ionicons
            name={item.privacy === 'PUBLIC' ? 'globe-outline' : 'lock-closed-outline'}
            size={14}
            color={colors.text.secondary}
          />
          <Text style={styles.groupMetaText}>
            {item.membersCount.toLocaleString()} thành viên
          </Text>
        </View>
        {item.isMember && item.lastActivity && (
          <Text style={styles.groupActivity}>
            {item.postsToday} bài viết hôm nay • {item.lastActivity}
          </Text>
        )}
        {!item.isMember && (
          <Button
            title="Tham gia"
            onPress={() => {}}
            variant="outline"
            size="small"
            style={styles.joinButton}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.placeholder} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm nhóm"
          placeholderTextColor={colors.text.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.text.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === 'my' ? colors.white : colors.text.primary}
          />
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            Nhóm của bạn
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
          onPress={() => setActiveTab('discover')}
        >
          <Ionicons
            name="compass"
            size={18}
            color={activeTab === 'discover' ? colors.white : colors.text.primary}
          />
          <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>
            Khám phá
          </Text>
        </TouchableOpacity>
      </View>

      {/* Create Group */}
      <TouchableOpacity style={styles.createGroupButton}>
        <View style={styles.createGroupIcon}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </View>
        <Text style={styles.createGroupText}>Tạo nhóm mới</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
      </TouchableOpacity>

      {/* Section Title */}
      <Text style={styles.sectionTitle}>
        {activeTab === 'my' ? 'Nhóm bạn tham gia' : 'Gợi ý cho bạn'}
      </Text>
    </View>
  );

  const data = activeTab === 'my' ? myGroups : discoverGroups;
  const filteredData = searchQuery
    ? data.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : data;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nhóm</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderGroupCard}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Không tìm thấy nhóm' : 'Chưa có nhóm nào'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Hãy tham gia hoặc tạo nhóm mới'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  headerButton: {
    padding: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
    marginLeft: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.white,
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  createGroupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createGroupText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
    marginLeft: spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  groupCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  groupCover: {
    width: '100%',
    height: 100,
  },
  groupContent: {
    padding: spacing.md,
  },
  groupName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  groupMetaText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  groupActivity: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  joinButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default GroupListScreen;
