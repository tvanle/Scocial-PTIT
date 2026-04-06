import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { Strings, DEFAULT_AVATAR } from '../../constants/strings';
import { User } from '../../types';

const mockUsers: User[] = [
  { id: '2', fullName: 'Tran Van B', avatar: DEFAULT_AVATAR, studentId: 'B21DCCN002', faculty: 'CNTT', email: '', createdAt: '', updatedAt: '' },
  { id: '3', fullName: 'Le Thi C', avatar: DEFAULT_AVATAR, studentId: 'B21DCCN003', faculty: 'CNTT', email: '', createdAt: '', updatedAt: '' },
  { id: '4', fullName: 'Pham Van D', avatar: DEFAULT_AVATAR, studentId: 'B21DCAT001', faculty: 'ATTT', email: '', createdAt: '', updatedAt: '' },
];

const recentSearches = [
  { id: '1', text: 'Lap trinh React Native', type: 'keyword' },
  { id: '2', text: 'Tran Van B', type: 'user' },
  { id: '3', text: 'CLB Lap trinh', type: 'group' },
];

interface SearchScreenProps {
  navigation: any;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recentList, setRecentList] = useState(recentSearches);
  const [isFocused, setIsFocused] = useState(false);

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
        <Text style={styles.followButtonText}>Theo doi</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRecentSearches = () => (
    <View style={styles.recentContainer}>
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Gan day</Text>
        {recentList.length > 0 && (
          <TouchableOpacity onPress={handleClearRecent}>
            <Text style={styles.clearText}>Xoa tat ca</Text>
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
      <Text style={styles.sectionTitle}>Moi nguoi</Text>
      {mockUsers.map(renderUserItem)}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
            <Ionicons name="search" size={20} color={isFocused ? Colors.primary : Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tim kiem ban be, bai viet..."
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={handleSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  safeArea: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backButton: {
    padding: Spacing.xxs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    height: 44,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
  },
  searchBarFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
