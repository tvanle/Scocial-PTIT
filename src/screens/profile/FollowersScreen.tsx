import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { RootStackParamList, User } from '../../types';
import { userService } from '../../services/user/userService';
import { useAuthStore } from '../../store/slices/authSlice';
import { DEFAULT_AVATAR } from '../../constants/strings';
import { getImageUrl } from '../../utils/image';
import { useTheme } from '../../hooks/useThemeColors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FollowersRouteProp = RouteProp<RootStackParamList, 'Followers'>;

type TabType = 'followers' | 'following';

const FollowersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FollowersRouteProp>();
  const { userId, initialTab } = route.params as { userId: string; initialTab?: TabType };
  const currentUser = useAuthStore((s) => s.user);
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'followers');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        userService.getFollowers(userId),
        userService.getFollowing(userId),
      ]);
      setFollowers(followersRes.data || []);
      setFollowing(followingRes.data || []);
    } catch (error) {
      console.error('Error fetching followers/following:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleFollow = async (targetUserId: string) => {
    const isCurrentlyFollowing = followingStates[targetUserId];

    setFollowingStates((prev) => ({
      ...prev,
      [targetUserId]: !isCurrentlyFollowing,
    }));

    try {
      if (isCurrentlyFollowing) {
        await userService.unfollow(targetUserId);
      } else {
        await userService.follow(targetUserId);
      }
    } catch (error) {
      setFollowingStates((prev) => ({
        ...prev,
        [targetUserId]: isCurrentlyFollowing,
      }));
      console.error('Error following/unfollowing:', error);
    }
  };

  const handleUserPress = (targetUserId: string) => {
    if (targetUserId === currentUser?.id) {
      navigation.navigate('Main', { screen: 'Profile' } as any);
    } else {
      navigation.navigate('UserProfile', { userId: targetUserId });
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isOwnProfile = item.id === currentUser?.id;
    const isFollowing = followingStates[item.id] ?? false;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => handleUserPress(item.id)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: getImageUrl(item.avatar) || DEFAULT_AVATAR }}
          style={[styles.avatar, { backgroundColor: colors.gray200 }]}
        />
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.fullName, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.fullName}
            </Text>
            {item.isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.verified}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
          {item.bio && (
            <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
        {!isOwnProfile && (
          <TouchableOpacity
            style={[
              styles.followBtn,
              { backgroundColor: colors.primary },
              isFollowing && [styles.followingBtn, { backgroundColor: colors.gray100, borderColor: colors.gray200 }]
            ]}
            onPress={() => handleFollow(item.id)}
          >
            <Text style={[styles.followBtnText, { color: isFollowing ? colors.textPrimary : colors.white }]}>
              {isFollowing ? 'Dang theo doi' : 'Theo doi'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const data = activeTab === 'followers' ? followers : following;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.gray200 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.gray100 }]}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Nguoi theo doi</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Dang tai...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.gray200 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.gray100 }]}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Ket noi</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.background, borderBottomColor: colors.gray200 }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'followers' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('followers')}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'followers' && { color: colors.primary, fontWeight: FontWeight.bold }]}>
              Nguoi theo doi ({followers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'following' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('following')}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'following' && { color: colors.primary, fontWeight: FontWeight.bold }]}>
              Dang theo doi ({following.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* User List */}
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'followers' ? 'people-outline' : 'person-add-outline'}
                size={48}
                color={colors.gray200}
              />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                {activeTab === 'followers'
                  ? 'Chua co nguoi theo doi nao'
                  : 'Chua theo doi ai'}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  activeTabText: {
    fontWeight: FontWeight.bold,
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(196, 30, 58, 0.1)',
  },
  tabBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  tabBadgeTextActive: {
    // Color applied inline for theme support
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    // backgroundColor applied inline for theme support
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  studentIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  studentId: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    // Color applied inline for theme support
  },
  bio: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  followingBtn: {
    borderWidth: 1,
  },
  followBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    // Color applied inline for theme support
  },
  followingBtnText: {
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FontSize.md,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
});

export default FollowersScreen;
