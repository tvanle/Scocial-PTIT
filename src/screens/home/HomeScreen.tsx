import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header, IconButton } from '../../components/common';
import { PostCard, CreatePostBox, StoryBar } from '../../components/home';
import { Colors, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post, User } from '../../types';

// Mock data
const mockStories = [
  {
    id: '1',
    user: { id: '2', fullName: 'Trần Văn B', avatar: 'https://i.pravatar.cc/150?img=2' } as User,
    thumbnail: 'https://picsum.photos/200/350?random=1',
    hasUnread: true,
  },
  {
    id: '2',
    user: { id: '3', fullName: 'Lê Thị C', avatar: 'https://i.pravatar.cc/150?img=3' } as User,
    thumbnail: 'https://picsum.photos/200/350?random=2',
    hasUnread: true,
  },
  {
    id: '3',
    user: { id: '4', fullName: 'Phạm Văn D', avatar: 'https://i.pravatar.cc/150?img=4' } as User,
    thumbnail: 'https://picsum.photos/200/350?random=3',
    hasUnread: false,
  },
  {
    id: '4',
    user: { id: '5', fullName: 'Nguyễn Thị E', avatar: 'https://i.pravatar.cc/150?img=5' } as User,
    thumbnail: 'https://picsum.photos/200/350?random=4',
    hasUnread: true,
  },
];

const mockPosts: Post[] = [
  {
    id: '1',
    author: {
      id: '2',
      fullName: 'Trần Văn B',
      avatar: 'https://i.pravatar.cc/150?img=2',
      studentId: 'B21DCCN002',
      isOnline: true,
      isVerified: true,
      createdAt: '',
      updatedAt: '',
      email: '',
    },
    content: 'Hôm nay trời đẹp quá, đi học thôi nào! 🌤️\n\nChúc mọi người một ngày học tập hiệu quả tại PTIT nhé! #PTITLife #SinhVienPTIT',
    media: [
      { id: '1', url: 'https://picsum.photos/800/600?random=1', type: 'image' },
    ],
    privacy: 'public',
    likesCount: 128,
    commentsCount: 24,
    sharesCount: 5,
    isLiked: false,
    isSaved: false,
    isShared: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    location: 'Học viện PTIT',
    feeling: '😊 vui vẻ',
  },
  {
    id: '2',
    author: {
      id: '3',
      fullName: 'Lê Thị C',
      avatar: 'https://i.pravatar.cc/150?img=3',
      studentId: 'B21DCCN003',
      isOnline: false,
      isVerified: false,
      createdAt: '',
      updatedAt: '',
      email: '',
    },
    content: 'Chia sẻ một số kinh nghiệm học lập trình cho các bạn sinh viên năm nhất:\n\n1. Học đều đặn mỗi ngày\n2. Thực hành nhiều hơn lý thuyết\n3. Tham gia các project thực tế\n4. Học hỏi từ senior\n\nChúc các bạn thành công! 💪',
    media: [
      { id: '2', url: 'https://picsum.photos/800/600?random=2', type: 'image' },
      { id: '3', url: 'https://picsum.photos/800/600?random=3', type: 'image' },
    ],
    privacy: 'friends',
    likesCount: 256,
    commentsCount: 48,
    sharesCount: 32,
    isLiked: true,
    isSaved: true,
    isShared: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    author: {
      id: '4',
      fullName: 'Phạm Văn D',
      avatar: 'https://i.pravatar.cc/150?img=4',
      studentId: 'B21DCCN004',
      isOnline: true,
      isVerified: true,
      createdAt: '',
      updatedAt: '',
      email: '',
    },
    content: 'Vừa hoàn thành xong project cuối kỳ môn Phát triển ứng dụng di động! 🎉\n\nCảm ơn team đã cùng nhau cố gắng trong suốt 2 tháng qua. Kết quả không phụ lòng những đêm thức trắng code 😂',
    media: [
      { id: '4', url: 'https://picsum.photos/800/600?random=4', type: 'image' },
      { id: '5', url: 'https://picsum.photos/800/600?random=5', type: 'image' },
      { id: '6', url: 'https://picsum.photos/800/600?random=6', type: 'image' },
      { id: '7', url: 'https://picsum.photos/800/600?random=7', type: 'image' },
    ],
    privacy: 'public',
    likesCount: 512,
    commentsCount: 86,
    sharesCount: 28,
    isLiked: false,
    isSaved: false,
    isShared: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    feeling: '🥳 hạnh phúc',
  },
  {
    id: '4',
    author: {
      id: '5',
      fullName: 'Nguyễn Thị E',
      avatar: 'https://i.pravatar.cc/150?img=5',
      studentId: 'B21DCAT001',
      isOnline: false,
      isVerified: false,
      createdAt: '',
      updatedAt: '',
      email: '',
    },
    content: 'Có ai biết quán cafe yên tĩnh gần trường để học bài không ạ? Mình đang cần không gian học tập cho kỳ thi tới 📚',
    privacy: 'public',
    likesCount: 45,
    commentsCount: 32,
    sharesCount: 2,
    isLiked: false,
    isSaved: false,
    isShared: false,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  }, []);

  const handleCreatePost = () => {
    navigation.navigate('CreatePost');
  };

  const handlePostPress = (postId: string) => {
    navigation.navigate('PostDetail', { postId });
  };

  const handleProfilePress = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const handleStoryPress = (storyId: string) => {
    console.log('View story:', storyId);
  };

  const handleCreateStory = () => {
    console.log('Create story');
  };

  const handleMessenger = () => {
    navigation.navigate('Messages');
  };

  const renderHeader = () => (
    <>
      <StoryBar
        currentUser={user}
        stories={mockStories}
        onCreateStory={handleCreateStory}
        onStoryPress={handleStoryPress}
      />
      <CreatePostBox
        user={user}
        onPress={handleCreatePost}
        onPhotoPress={handleCreatePost}
        onVideoPress={handleCreatePost}
        onFeelingPress={handleCreatePost}
      />
    </>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => handlePostPress(item.id)}
      onProfilePress={() => handleProfilePress(item.author.id)}
      onComment={() => handlePostPress(item.id)}
      onShare={() => console.log('Share post:', item.id)}
      onMenuPress={() => console.log('Menu:', item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <Header
        showLogo
        rightComponent={
          <View style={styles.headerRight}>
            <IconButton
              icon="add-circle-outline"
              onPress={handleCreatePost}
              variant="ghost"
              size={36}
              iconSize={26}
            />
            <IconButton
              icon="chatbubble-ellipses-outline"
              onPress={handleMessenger}
              variant="ghost"
              size={36}
              iconSize={26}
              badge={3}
            />
          </View>
        }
      />

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
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
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
});

export default HomeScreen;
