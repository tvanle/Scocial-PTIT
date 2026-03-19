import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating/strings';
import { DATING_SPACING } from '../../../constants/dating/tokens';
import datingService from '../../../services/dating/datingService';
import type { DiscoveryCard, RootStackParamList } from '../../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DiscoveryBottomNav } from '../discovery/components';

const colors = DATING_COLORS.discovery;
const strings = DATING_STRINGS.discovery;

interface LikesGridItemProps {
  item: DiscoveryCard;
  onPress: (item: DiscoveryCard) => void;
}

const CARD_MARGIN = DATING_SPACING.md;
const HEADER_ICON_SIZE = DATING_LAYOUT.discovery.header.iconSize;
const NUM_COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;
const CARD_BORDER_RADIUS = 18;

const LikesGridItem: React.FC<LikesGridItemProps> = React.memo(({ item, onPress }) => {
  const title = useMemo(() => {
    const name = item.user.fullName ?? strings.unknownName;
    return `${name}, 24`;
  }, [item.user.fullName]);

  const handlePress = useCallback(() => onPress(item), [onPress, item]);

  return (
    <TouchableOpacity
      style={styles.cardWrapper}
      activeOpacity={0.8}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.card}>
        <Image
          source={{ uri: item.photos[0]?.url ?? '' }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.cardTopRow}>
          <View style={styles.heartPill}>
            <MaterialIcons name="favorite" size={14} color={colors.matchText} />
            <Text style={styles.heartPillText}>New like</Text>
          </View>
        </View>
        <View style={styles.cardOverlay}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            Xem hồ sơ
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export const DatingLikesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    data: incomingLikes,
    isLoading: isLoadingIncoming,
    refetch: refetchIncoming,
  } = useQuery({
    queryKey: ['dating', 'likes', 'incoming'],
    queryFn: () => datingService.getIncomingLikes({ page: 1, limit: 20 }),
  });

  const listData = incomingLikes?.data ?? [];
  const isLoading = isLoadingIncoming;

  const handleCardPress = useCallback(
    (card: DiscoveryCard) => {
      navigation.navigate('DatingProfileDetail', { profile: card });
    },
    [navigation],
  );

  const handleGoMyProfile = useCallback(() => {
    navigation.navigate('DatingMyProfile');
  }, [navigation]);

  const handleBackToSocial = useCallback(() => {
    navigation.navigate('Main' as any);
  }, [navigation]);

  const handleInfoPress = useCallback(() => {
    Alert.alert(
      'Về tính năng Likes',
      'Đây là danh sách những người đã thích hồ sơ của bạn. Nhấn vào hồ sơ để xem chi tiết và quyết định thích lại hoặc bỏ qua.',
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: DiscoveryCard }) => (
      <LikesGridItem item={item} onPress={handleCardPress} />
    ),
    [handleCardPress],
  );

  const handleBottomTabPress = useCallback(
    (key: string) => {
      if (key === 'discover') {
        navigation.navigate('DatingDiscovery');
        return;
      }
      if (key === 'likes') {
        return;
      }
      if (key === 'profile') {
        navigation.navigate('DatingMyProfile');
        return;
      }
      if (key === 'chats') {
        navigation.navigate('DatingChatList');
      }
    },
    [navigation],
  );

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              accessibilityRole="button"
              accessibilityLabel="Quay về mạng xã hội"
              onPress={handleBackToSocial}
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.subtitleColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              accessibilityRole="button"
              accessibilityLabel="My profile"
              onPress={handleGoMyProfile}
            >
              <MaterialIcons name="person" size={20} color={colors.subtitleColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Likes</Text>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{listData.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.headerIconBtn}
            accessibilityRole="button"
            accessibilityLabel="Likes info"
            onPress={handleInfoPress}
          >
            <MaterialIcons name="info-outline" size={20} color={colors.subtitleColor} />
          </TouchableOpacity>
        </View>

        <FlatList
          contentContainerStyle={[
            styles.listContent,
            listData.length === 0 && styles.emptyListContent,
          ]}
          data={listData}
          keyExtractor={(item) => item.userId}
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
          refreshing={isLoading}
          onRefresh={refetchIncoming}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="favorite-border" size={64} color={colors.navInactive} />
                <Text style={styles.emptyTitle}>Chưa có lượt thích mới</Text>
                <Text style={styles.emptySubtitle}>
                  Khi ai đó thích hồ sơ của bạn, họ sẽ xuất hiện ở đây. Những người bạn đã thích
                  lại sẽ chuyển sang mục Tin nhắn.
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
      <DiscoveryBottomNav activeTab="likes" onTabPress={handleBottomTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DATING_SPACING.lg,
    paddingTop: DATING_SPACING.lg,
    paddingBottom: DATING_SPACING.sm,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.title,
  },
  headerBadge: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: DATING_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.matchText,
  },
  headerIconBtn: {
    width: HEADER_ICON_SIZE,
    height: HEADER_ICON_SIZE,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: CARD_MARGIN,
    paddingBottom: DATING_SPACING.xl,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: DATING_SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.title,
    marginTop: DATING_SPACING.md,
    marginBottom: DATING_SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.navInactive,
    textAlign: 'center',
    lineHeight: 20,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN / 2,
    marginBottom: CARD_MARGIN,
  },
  card: {
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  cardTopRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  heartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heartPillText: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '600',
    color: colors.matchText,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.matchText,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: colors.navInactive,
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});

export default DatingLikesScreen;

