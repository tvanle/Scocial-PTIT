import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Avatar } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useTheme } from '../../hooks/useThemeColors';
import { User } from '../../types';
import { userService } from '../../services/user/userService';

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 10;

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

interface SearchScreenProps {
  navigation: any;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const loadSearchHistory = async () => {
    try {
      const data = await SecureStore.getItemAsync(SEARCH_HISTORY_KEY);
      if (data) {
        setSearchHistory(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const saveSearchHistory = async (history: SearchHistoryItem[]) => {
    try {
      await SecureStore.setItemAsync(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  const addToHistory = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: trimmedQuery,
      timestamp: Date.now(),
    };

    // Remove duplicate if exists
    const filtered = searchHistory.filter(
      item => item.query.toLowerCase() !== trimmedQuery.toLowerCase()
    );

    // Add new item at the beginning and limit to MAX_HISTORY_ITEMS
    const newHistory = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    setSearchHistory(newHistory);
    await saveSearchHistory(newHistory);
  };

  const removeFromHistory = async (id: string) => {
    const newHistory = searchHistory.filter(item => item.id !== id);
    setSearchHistory(newHistory);
    await saveSearchHistory(newHistory);
  };

  const clearAllHistory = async () => {
    setSearchHistory([]);
    await SecureStore.deleteItemAsync(SEARCH_HISTORY_KEY);
  };

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim().length === 0) {
      setUsers([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const response = await userService.searchUsers(searchQuery.trim(), { page: 1, limit: 20 });
        setUsers(response.data || []);
        // Save to history when search completes
        if (response.data && response.data.length > 0) {
          addToHistory(searchQuery.trim());
        }
      } catch (error) {
        console.error('Search error:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const handleHistoryItemPress = (query: string) => {
    setSearchQuery(query);
  };

  const handleUserPress = (userId: string) => {
    Keyboard.dismiss();
    navigation.navigate('UserProfile', { userId });
  };

  const handleChatPress = (userId: string) => {
    Keyboard.dismiss();
    navigation.navigate('ChatRoom', { userId });
  };

  const renderUserItem = ({ item: user }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { borderBottomColor: colors.gray100 }]}
      onPress={() => handleUserPress(user.id)}
      activeOpacity={0.7}
    >
      <Avatar uri={user.avatar} name={user.fullName || ''} size="lg" />
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>{user.fullName}</Text>
          {user.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
          )}
        </View>
        <Text style={[styles.userDetail, { color: colors.textSecondary }]} numberOfLines={1}>
          {user.studentId ? `${user.studentId}` : ''}{user.faculty ? ` · ${user.faculty}` : ''}
        </Text>
        {user.bio && (
          <Text style={[styles.userBio, { color: colors.textTertiary }]} numberOfLines={1}>{user.bio}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.chatButton, { backgroundColor: colors.gray100 }]}
        onPress={() => handleChatPress(user.id)}
      >
        <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: SearchHistoryItem }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleHistoryItemPress(item.query)}
      activeOpacity={0.7}
    >
      <View style={[styles.historyIcon, { backgroundColor: colors.gray100 }]}>
        <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
      </View>
      <Text style={[styles.historyText, { color: colors.textPrimary }]} numberOfLines={1}>{item.query}</Text>
      <TouchableOpacity
        style={styles.historyRemove}
        onPress={() => removeFromHistory(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSearchHistory = () => {
    if (searchHistory.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrapper, { backgroundColor: colors.gray100 }]}>
            <Ionicons name="search" size={48} color={colors.gray300} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Tìm kiếm bạn bè</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Nhập tên, mã sinh viên hoặc email để tìm kiếm
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.historyContainer}>
        <View style={[styles.historyHeader, { borderBottomColor: colors.gray100 }]}>
          <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>Tìm kiếm gần đây</Text>
          <TouchableOpacity onPress={clearAllHistory}>
            <Text style={[styles.clearAllText, { color: colors.primary }]}>Xóa tất cả</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={searchHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    if (!hasSearched) {
      return renderSearchHistory();
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconWrapper, { backgroundColor: colors.gray100 }]}>
          <Ionicons name="person-outline" size={48} color={colors.gray300} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Không tìm thấy kết quả</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Thử tìm kiếm với từ khóa khác
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header with Search */}
      <View style={[styles.header, { borderBottomColor: colors.gray200 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={[styles.searchBar, { backgroundColor: colors.gray100 }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Tìm kiếm người dùng..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tìm kiếm...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={renderEmpty}
          ListHeaderComponent={
            users.length > 0 ? (
              <Text style={[styles.resultCount, { color: colors.textSecondary, backgroundColor: colors.gray100 }]}>
                Tìm thấy {users.length} kết quả
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    height: '100%',
  },
  clearButton: {
    padding: Spacing.xs,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  resultCount: {
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
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
    flexShrink: 1,
  },
  userDetail: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  userBio: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  chatButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop: 100,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  historyContainer: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  historyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  clearAllText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyText: {
    flex: 1,
    fontSize: FontSize.md,
    marginLeft: Spacing.md,
  },
  historyRemove: {
    padding: Spacing.sm,
  },
});

export default SearchScreen;
