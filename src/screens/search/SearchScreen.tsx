import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { User, Group } from '../../types';

const mockUsers: User[] = [
  { id: '2', fullName: 'Trần Văn B', avatar: 'https://i.pravatar.cc/150?img=2', studentId: 'B21DCCN002', faculty: 'CNTT', email: '', createdAt: '', updatedAt: '' },
  { id: '3', fullName: 'Lê Thị C', avatar: 'https://i.pravatar.cc/150?img=3', studentId: 'B21DCCN003', faculty: 'CNTT', email: '', createdAt: '', updatedAt: '' },
  { id: '4', fullName: 'Phạm Văn D', avatar: 'https://i.pravatar.cc/150?img=4', studentId: 'B21DCAT001', faculty: 'ATTT', email: '', createdAt: '', updatedAt: '' },
];

const recentSearches = [
  { id: '1', text: 'Lập trình React Native', type: 'keyword' },
  { id: '2', text: 'Trần Văn B', type: 'user' },
  { id: '3', text: 'CLB Lập trình', type: 'group' },
];

interface SearchScreenProps {
  navigation: any;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recentList, setRecentList] = useState(recentSearches);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(query.trim().length > 0);
  }, []);

  const handleUserPress = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const handleClearRecent = () => {
    setRecentList([]);
  };

  const renderUserItem = (user: User) => (
    <TouchableOpacity
      key={user.id}
      style={styles.userItem}
      onPress={() => handleUserPress(user.id)}
      activeOpacity={0.7}
    >
      <Avatar uri={user.avatar} name={user.fullName} size="md" />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.fullName}</Text>
        <Text style={styles.userDetail}>
          {user.studentId} · {user.faculty}
        </Text>
      </View>
      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.followButtonText}>Theo dõi</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRecentSearches = () => (
    <View style={styles.recentContainer}>
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Gần đây</Text>
        {recentList.length > 0 && (
          <TouchableOpacity onPress={handleClearRecent}>
            <Text style={styles.clearText}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>
      {recentList.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.recentItem}
          onPress={() => handleSearch(item.text)}
        >
          <View style={styles.recentIcon}>
            <Ionicons
              name={item.type === 'user' ? 'person-outline' : 'time-outline'}
              size={18}
              color={Colors.textSecondary}
            />
          </View>
          <Text style={styles.recentText}>{item.text}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => setRecentList(recentList.filter(r => r.id !== item.id))}
          >
            <Ionicons name="close" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSearchResults = () => (
    <View style={styles.resultsContainer}>
      <Text style={styles.sectionTitle}>Mọi người</Text>
      {mockUsers.map(renderUserItem)}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar as primary header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bạn bè, bài viết..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="mic-outline" size={20} color={Colors.textTertiary} />
          )}
        </View>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={isSearching ? renderSearchResults : renderRecentSearches}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  listContent: {
    paddingBottom: 100,
  },
  recentContainer: {
    paddingTop: Spacing.md,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  clearText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semiBold,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  resultsContainer: {
    paddingTop: Spacing.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  userDetail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  followButtonText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});

export default SearchScreen;
