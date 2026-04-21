import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useTheme } from '../../hooks/useThemeColors';
import songsData from '../../../songs.json';

interface SongItem {
  title: string;
  artist: string;
  artwork_url: string;
  embed_url: string;
}

export interface SelectedSong {
  title: string;
  artist: string;
  artworkUrl: string | null;
}

interface MusicPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (song: SelectedSong) => void;
  currentSong?: string | null;
}

const allSongs = songsData as SongItem[];

export const MusicPicker: React.FC<MusicPickerProps> = ({
  visible,
  onClose,
  onSelect,
  currentSong,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) {
      return allSongs.slice(0, 50);
    }
    const query = searchQuery.toLowerCase().trim();
    return allSongs
      .filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.artist.toLowerCase().includes(query)
      )
      .slice(0, 50);
  }, [searchQuery]);

  const handleSelect = useCallback(
    (item: SongItem) => {
      onSelect({
        title: item.title,
        artist: item.artist,
        artworkUrl: item.artwork_url || null,
      });
      setSearchQuery('');
      onClose();
    },
    [onSelect, onClose]
  );

  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  const renderSongItem = useCallback(
    ({ item }: { item: SongItem }) => (
      <TouchableOpacity
        style={[styles.songRow, { borderBottomColor: colors.gray50 }]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        {item.artwork_url ? (
          <Image source={{ uri: item.artwork_url }} style={[styles.songArtwork, { backgroundColor: colors.gray100 }]} />
        ) : (
          <View style={[styles.songArtwork, styles.noArtwork, { backgroundColor: colors.gray100 }]}>
            <Ionicons name="musical-notes" size={20} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.songArtist, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>
        <Ionicons name="add-circle" size={24} color={colors.primary} />
      </TouchableOpacity>
    ),
    [handleSelect, colors]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: colors.gray200 }]} />

          <View style={[styles.header, { borderBottomColor: colors.gray100 }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Chọn bài hát</Text>
            <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.gray100 }]}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchContainer, { backgroundColor: colors.gray100 }]}>
            <Ionicons name="search" size={20} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm bài hát hoặc nghệ sĩ..."
              placeholderTextColor={colors.textTertiary}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredSongs}
            keyExtractor={(item, index) => `${item.embed_url}-${index}`}
            renderItem={renderSongItem}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.songList}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="musical-notes-outline" size={48} color={colors.gray300} />
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Không tìm thấy bài hát</Text>
              </View>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: Spacing.sm,
  },
  songList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  songArtwork: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  noArtwork: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
    gap: 2,
  },
  songTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  songArtist: {
    fontSize: FontSize.sm,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
  },
});

export default MusicPicker;
