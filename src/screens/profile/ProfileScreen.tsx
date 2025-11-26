import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Button, Card, Header } from '../../components/common';
import { PostCard } from '../../components/home';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 200;

// Mock user posts
const mockUserPosts: Post[] = [
  {
    id: '1',
    author: {
      id: '1',
      fullName: 'Nguyễn Văn A',
      avatar: 'https://i.pravatar.cc/150?img=1',
      studentId: 'B21DCCN001',
      isOnline: true,
      isVerified: true,
      createdAt: '',
      updatedAt: '',
      email: '',
    },
    content: 'Một ngày mới, một khởi đầu mới! 🌟\n\nCố gắng hoàn thành project trước deadline nào các bạn ơi!',
    media: [
      { id: '1', url: 'https://picsum.photos/800/600?random=10', type: 'image' },
    ],
    privacy: 'public',
    likesCount: 89,
    commentsCount: 12,
    sharesCount: 3,
    isLiked: false,
    isSaved: false,
    isShared: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    author: {
      id: '1',
      fullName: 'Nguyễn Văn A',
      avatar: 'https://i.pravatar.cc/150?img=1',
      studentId: 'B21DCCN001',
      isOnline: true,
      isVerified: true,
      createdAt: '',
      updatedAt: '',
      email: '',
    },
    content: 'Vừa nhận được học bổng khuyến khích học tập kỳ này! 🎉\n\nCảm ơn thầy cô và các bạn đã hỗ trợ mình trong suốt quá trình học tập.',
    privacy: 'public',
    likesCount: 256,
    commentsCount: 45,
    sharesCount: 8,
    isLiked: true,
    isSaved: false,
    isShared: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    feeling: '🥳 hạnh phúc',
  },
];

interface ProfileScreenProps {
  navigation: any;
  route?: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation, route }) => {
  const { user: currentUser } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'photos' | 'friends'>('posts');

  // If viewing another user's profile, use route params
  const isOwnProfile = !route?.params?.userId || route?.params?.userId === currentUser?.id;
  const user = isOwnProfile ? currentUser : null; // In production, fetch user data

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  }, []);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handlePostPress = (postId: string) => {
    navigation.navigate('PostDetail', { postId });
  };

  const renderProfileInfo = () => (
    <>
      {/* Cover Photo */}
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: user?.coverPhoto || 'https://images.unsplash.com/photo-1562774053-701939374585?w=800' }}
          style={styles.coverPhoto}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)']}
          style={styles.coverGradient}
        />
        {isOwnProfile && (
          <TouchableOpacity style={styles.changeCoverButton}>
            <Ionicons name="camera" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarWrapper}>
          <Avatar
            uri={user?.avatar}
            name={user?.fullName || ''}
            size="profile"
            showEditButton={isOwnProfile}
            onEditPress={() => console.log('Change avatar')}
          />
        </View>
      </View>

      {/* User Info */}
      <View style={styles.userInfoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{user?.fullName}</Text>
          {user?.isVerified && (
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={Colors.primary}
              style={styles.verifiedIcon}
            />
          )}
        </View>

        {user?.bio && (
          <Text style={styles.bio}>{user.bio}</Text>
        )}

        {/* Student Info */}
        <View style={styles.studentInfo}>
          {user?.studentId && (
            <View style={styles.infoItem}>
              <Ionicons name="card-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{user.studentId}</Text>
            </View>
          )}
          {user?.faculty && (
            <View style={styles.infoItem}>
              <Ionicons name="school-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{user.faculty}</Text>
            </View>
          )}
          {user?.currentCity && (
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{user.currentCity}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.friendsCount || 0}</Text>
            <Text style={styles.statLabel}>Bạn bè</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.followersCount || 0}</Text>
            <Text style={styles.statLabel}>Theo dõi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.postsCount || 0}</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isOwnProfile ? (
            <>
              <Button
                title={Strings.profile.editProfile}
                onPress={handleEditProfile}
                variant="primary"
                style={styles.actionButton}
                icon={<Ionicons name="pencil" size={18} color={Colors.textLight} />}
              />
              <Button
                title=""
                onPress={handleSettings}
                variant="outline"
                style={styles.settingsButton}
                icon={<Ionicons name="settings-outline" size={20} color={Colors.primary} />}
              />
            </>
          ) : (
            <>
              <Button
                title={Strings.profile.addFriend}
                onPress={() => {}}
                variant="primary"
                style={styles.actionButton}
                icon={<Ionicons name="person-add" size={18} color={Colors.textLight} />}
              />
              <Button
                title={Strings.profile.message}
                onPress={() => {}}
                variant="outline"
                style={styles.actionButton}
                icon={<Ionicons name="chatbubble" size={18} color={Colors.primary} />}
              />
            </>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            {Strings.profile.myPosts}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photos' && styles.activeTab]}
          onPress={() => setActiveTab('photos')}
        >
          <Text style={[styles.tabText, activeTab === 'photos' && styles.activeTabText]}>
            {Strings.profile.myPhotos}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            {Strings.profile.myFriends}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return mockUserPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onPress={() => handlePostPress(post.id)}
            onProfilePress={() => {}}
          />
        ));
      case 'photos':
        return (
          <View style={styles.photosGrid}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <TouchableOpacity key={i} style={styles.photoItem}>
                <Image
                  source={{ uri: `https://picsum.photos/300/300?random=${i + 20}` }}
                  style={styles.photo}
                />
              </TouchableOpacity>
            ))}
          </View>
        );
      case 'friends':
        return (
          <Card style={styles.friendsCard}>
            <Text style={styles.friendsTitle}>
              {user?.friendsCount || 0} {Strings.nav.friends}
            </Text>
            <View style={styles.friendsGrid}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <TouchableOpacity key={i} style={styles.friendItem}>
                  <Avatar
                    uri={`https://i.pravatar.cc/150?img=${i + 10}`}
                    name={`Bạn ${i}`}
                    size="lg"
                  />
                  <Text style={styles.friendName} numberOfLines={1}>
                    Bạn bè {i}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              title="Xem tất cả bạn bè"
              onPress={() => navigation.navigate('Friends')}
              variant="outline"
              fullWidth
              style={styles.viewAllButton}
            />
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title={isOwnProfile ? Strings.nav.profile : user?.fullName}
        showBackButton={!isOwnProfile}
        onBackPress={() => navigation.goBack()}
        rightIcon={isOwnProfile ? 'search-outline' : 'ellipsis-horizontal'}
        onRightPress={() => {}}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderProfileInfo()}
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  coverContainer: {
    height: COVER_HEIGHT,
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  changeCoverButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -60,
    zIndex: 10,
  },
  avatarWrapper: {
    borderWidth: 4,
    borderColor: Colors.background,
    borderRadius: 64,
  },
  userInfoContainer: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  userName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  verifiedIcon: {
    marginLeft: Spacing.xs,
  },
  bio: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  studentInfo: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  settingsButton: {
    width: 48,
    paddingHorizontal: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  contentContainer: {
    paddingBottom: Spacing.xxl,
  },
  // Photos
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.xs,
    backgroundColor: Colors.background,
  },
  photoItem: {
    width: (SCREEN_WIDTH - Spacing.xs * 4) / 3,
    height: (SCREEN_WIDTH - Spacing.xs * 4) / 3,
    margin: Spacing.xs / 2,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.xs,
  },
  // Friends
  friendsCard: {
    margin: Spacing.sm,
  },
  friendsTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  friendsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  friendItem: {
    width: '33.33%',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  friendName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    width: '100%',
    textAlign: 'center',
  },
  viewAllButton: {
    marginTop: Spacing.md,
  },
});

export default ProfileScreen;
