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
import { Avatar, Card } from '../../components/common';
import { PostCard } from '../../components/home';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { User, Post, Group } from '../../types';

// Mock search results
const mockUsers: User[] = [
  { id: '2', fullName: 'Trần Văn B', avatar: 'https://i.pravatar.cc/150?img=2', studentId: 'B21DCCN002', faculty: 'CNTT', email: '', createdAt: '', updatedAt: '' },
  { id: '3', fullName: 'Lê Thị C', avatar: 'https://i.pravatar.cc/150?img=3', studentId: 'B21DCCN003', faculty: 'CNTT', email: '', createdAt: '', updatedAt: '' },
  { id: '4', fullName: 'Phạm Văn D', avatar: 'https://i.pravatar.cc/150?img=4', studentId: 'B21DCAT001', faculty: 'ATTT', email: '', createdAt: '', updatedAt: '' },
];

const mockGroups: Group[] = [
  { id: '1', name: 'CLB Lập trình PTIT', avatar: 'https://picsum.photos/100?random=1', membersCount: 1250, privacy: 'public', postsCount: 456, admins: [], moderators: [], isJoined: true, isPendingApproval: false, createdAt: '', updatedAt: '' },
  { id: '2', name: 'Hội sinh viên D21CQCN', avatar: 'https://picsum.photos/100?random=2', membersCount: 89, privacy: 'private', postsCount: 234, admins: [], moderators: [], isJoined: false, isPendingApproval: false, createdAt: '', updatedAt: '' },
];

const recentSearches = [
  { id: '1', text: 'Lập trình React Native', type: 'keyword' },
  { id: '2', text: 'Trần Văn B', type: 'user' },
  { id: '3', text: 'CLB Lập trình', type: 'group' },
];

interface SearchScreenProps {
  navigation: any;
}

type SearchTab = 'all' | 'people' | 'posts' | 'groups';

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setIsSearching(true);
      // Simulate search API call
    } else {
      setIsSearching(false);
    }
  }, []);

  const handleUserPress = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const handleGroupPress = (groupId: string) => {
    navigation.navigate('GroupDetail', { groupId });
  };

  const [recentList, setRecentList] = useState(recentSearches);

  const handleClearRecent = () => {
    setRecentList([]);
  };

  const renderRecentSearches = () => (
    <View style={styles.recentContainer}>
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>{Strings.search.recent}</Text>
        <TouchableOpacity onPress={handleClearRecent}>
          <Text style={styles.clearText}>{Strings.search.clearHistory}</Text>
        </TouchableOpacity>
      </View>
      {recentList.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.recentItem}
          onPress={() => handleSearch(item.text)}
        >
          <View style={styles.recentIcon}>
            <Ionicons
              name={item.type === 'user' ? 'person-outline' : item.type === 'group' ? 'people-outline' : 'time-outline'}
              size={20}
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

  const renderUserItem = (user: User) => (
    <TouchableOpacity
      key={user.id}
      style={styles.userItem}
      onPress={() => handleUserPress(user.id)}
    >
      <Avatar uri={user.avatar} name={user.fullName} size="md" />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.fullName}</Text>
        <Text style={styles.userDetail}>
          {user.studentId} • {user.faculty}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
      >
        <Ionicons name="person-add-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderGroupItem = (group: Group) => (
    <TouchableOpacity
      key={group.id}
      style={styles.groupItem}
      onPress={() => handleGroupPress(group.id)}
    >
      <Avatar uri={group.avatar} name={group.name} size="md" />
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupDetail}>
          {group.membersCount} thành viên • {group.privacy === 'public' ? 'Công khai' : 'Riêng tư'}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.joinButton, group.isJoined && styles.joinedButton]}
        onPress={() => handleGroupPress(group.id)}
      >
        <Text style={[styles.joinButtonText, group.isJoined && styles.joinedButtonText]}>
          {group.isJoined ? 'Đã tham gia' : 'Tham gia'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSearchResults = () => (
    <View style={styles.resultsContainer}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {(['all', 'people', 'posts', 'groups'] as SearchTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'all' ? 'Tất cả' :
               tab === 'people' ? Strings.search.people :
               tab === 'posts' ? Strings.search.posts : Strings.search.groups}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {(activeTab === 'all' || activeTab === 'people') && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{Strings.search.people}</Text>
          {mockUsers.map(renderUserItem)}
          <TouchableOpacity style={styles.seeAllButton} onPress={() => setActiveTab('people')}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </Card>
      )}

      {(activeTab === 'all' || activeTab === 'groups') && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{Strings.search.groups}</Text>
          {mockGroups.map(renderGroupItem)}
          <TouchableOpacity style={styles.seeAllButton} onPress={() => setActiveTab('groups')}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </Card>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.searchHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={Strings.search.placeholder}
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
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
    backgroundColor: Colors.backgroundSecondary,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    padding: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    height: 40,
    marginLeft: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  recentContainer: {
    backgroundColor: Colors.background,
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
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  clearText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
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
    backgroundColor: Colors.backgroundSecondary,
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
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.backgroundSecondary,
  },
  activeTab: {
    backgroundColor: Colors.primarySoft,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  section: {
    marginTop: Spacing.sm,
    padding: Spacing.lg,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  userDetail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    padding: Spacing.sm,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  groupInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  groupName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  groupDetail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  joinButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  joinedButton: {
    backgroundColor: Colors.backgroundSecondary,
  },
  joinButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textLight,
  },
  joinedButtonText: {
    color: Colors.textSecondary,
  },
  seeAllButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  seeAllText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
  },
});

export default SearchScreen;
