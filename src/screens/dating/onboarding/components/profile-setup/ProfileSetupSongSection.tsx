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
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { BRAND } from '../../../../../constants/dating/design-system/colors';
import songsData from '../../../../../../songs.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 40 - 24) / 3;

export interface SongValue {
  title: string;
  artist: string;
  artworkUrl: string | null;
  embedUrl: string;
  startTime?: number | null;
  endTime?: number | null;
}

interface SongItem {
  title: string;
  artist: string;
  artwork_url: string;
  embed_url: string;
}

interface ProfileSetupSongSectionProps {
  songs: SongValue[];
  onChange: (songs: SongValue[]) => void;
}

const MAX_SONGS = 3;
const allSongs = songsData as SongItem[];

export const ProfileSetupSongSection = React.memo<ProfileSetupSongSectionProps>(
  ({ songs, onChange }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [playingSong, setPlayingSong] = useState<SongValue | null>(null);

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

    const handleAddSong = useCallback(() => {
      setEditingIndex(songs.length);
      setShowPicker(true);
    }, [songs.length]);

    const handleEditSong = useCallback((index: number) => {
      setEditingIndex(index);
      setShowPicker(true);
    }, []);

    const handleSelectSong = useCallback(
      (item: SongItem) => {
        if (editingIndex === null) return;

        const newSong: SongValue = {
          title: item.title,
          artist: item.artist,
          artworkUrl: item.artwork_url || null,
          embedUrl: item.embed_url,
          startTime: null,
          endTime: null,
        };

        const next = [...songs];
        if (editingIndex < next.length) {
          next[editingIndex] = newSong;
        } else {
          next.push(newSong);
        }
        onChange(next);
        setShowPicker(false);
        setSearchQuery('');
        setEditingIndex(null);
      },
      [editingIndex, songs, onChange]
    );

    const handleRemoveSong = useCallback(
      (index: number) => {
        const next = songs.filter((_, i) => i !== index);
        onChange(next);
      },
      [songs, onChange]
    );

    const handleCloseModal = useCallback(() => {
      setShowPicker(false);
      setSearchQuery('');
      setEditingIndex(null);
    }, []);

    const handlePlaySong = useCallback((song: SongValue) => {
      setPlayingSong(song);
    }, []);

    const handleClosePlayer = useCallback(() => {
      setPlayingSong(null);
    }, []);

    const renderSongItem = useCallback(
      ({ item }: { item: SongItem }) => (
        <TouchableOpacity
          style={styles.searchSongRow}
          onPress={() => handleSelectSong(item)}
          activeOpacity={0.7}
        >
          {item.artwork_url ? (
            <Image source={{ uri: item.artwork_url }} style={styles.searchSongArtwork} />
          ) : (
            <View style={[styles.searchSongArtwork, styles.noArtwork]}>
              <MaterialIcons name="music-note" size={20} color="#999" />
            </View>
          )}
          <View style={styles.searchSongInfo}>
            <Text style={styles.searchSongTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.searchSongArtist} numberOfLines={1}>
              {item.artist}
            </Text>
          </View>
          <MaterialIcons name="add-circle" size={24} color={BRAND.primary} />
        </TouchableOpacity>
      ),
      [handleSelectSong]
    );

    // Generate SoundCloud embed HTML
    const getPlayerHtml = (embedUrl: string) => {
      // Ensure the embed URL has the right parameters
      const baseUrl = embedUrl.split('&')[0];
      const fullUrl = `${baseUrl}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;

      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body { width: 100%; height: 100%; background: #1a1a1a; overflow: hidden; }
              iframe { width: 100%; height: 166px; border: none; }
            </style>
          </head>
          <body>
            <iframe
              scrolling="no"
              frameborder="no"
              allow="autoplay; encrypted-media"
              src="${fullUrl}"
            ></iframe>
          </body>
        </html>
      `;
    };

    return (
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <MaterialIcons name="music-note" size={20} color={BRAND.primary} />
            <Text style={styles.sectionTitle}>My Anthem</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{songs.length}/{MAX_SONGS}</Text>
          </View>
        </View>
        <Text style={styles.sectionHint}>
          Thêm những bài hát yêu thích của bạn
        </Text>

        {/* Song Cards Grid */}
        <View style={styles.songsGrid}>
          {songs.map((song, index) => (
            <TouchableOpacity
              key={`song-${index}`}
              style={styles.songCard}
              onPress={() => handlePlaySong(song)}
              onLongPress={() => handleEditSong(index)}
              activeOpacity={0.8}
            >
              {/* Remove button */}
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveSong(index)}
                hitSlop={8}
              >
                <MaterialIcons name="close" size={14} color="#fff" />
              </TouchableOpacity>

              {/* Artwork */}
              {song.artworkUrl ? (
                <Image source={{ uri: song.artworkUrl }} style={styles.cardArtwork} />
              ) : (
                <View style={[styles.cardArtwork, styles.cardArtworkPlaceholder]}>
                  <MaterialIcons name="music-note" size={28} color="#ccc" />
                </View>
              )}

              {/* Play icon overlay */}
              <View style={styles.playOverlay}>
                <View style={styles.playIconCircle}>
                  <MaterialIcons name="play-arrow" size={20} color="#fff" />
                </View>
              </View>

              {/* Song info */}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={styles.cardArtist} numberOfLines={1}>
                  {song.artist}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Add button */}
          {songs.length < MAX_SONGS && (
            <TouchableOpacity
              style={styles.addCard}
              onPress={handleAddSong}
              activeOpacity={0.7}
            >
              <View style={styles.addIconCircle}>
                <MaterialIcons name="add" size={24} color={BRAND.primary} />
              </View>
              <Text style={styles.addCardText}>Thêm</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Modal */}
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn bài hát</Text>
                <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseBtn}>
                  <MaterialIcons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color="#999" />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Tìm bài hát hoặc nghệ sĩ..."
                  placeholderTextColor="#999"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                    <MaterialIcons name="close" size={18} color="#999" />
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={filteredSongs}
                keyExtractor={(item, index) => `${item.embed_url}-${index}`}
                renderItem={renderSongItem}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.songList}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="music-off" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>Không tìm thấy bài hát</Text>
                  </View>
                }
              />
            </View>
          </Pressable>
        </Modal>

        {/* Music Player Modal */}
        <Modal
          visible={!!playingSong}
          transparent
          animationType="slide"
          onRequestClose={handleClosePlayer}
        >
          <View style={styles.playerOverlay}>
            <View style={styles.playerSheet}>
              <View style={styles.playerHeader}>
                <View style={styles.playerHandle} />
                <TouchableOpacity onPress={handleClosePlayer} style={styles.playerCloseBtn}>
                  <MaterialIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {playingSong && (
                <>
                  <View style={styles.playerInfo}>
                    {playingSong.artworkUrl ? (
                      <Image source={{ uri: playingSong.artworkUrl }} style={styles.playerArtwork} />
                    ) : (
                      <View style={[styles.playerArtwork, styles.playerArtworkPlaceholder]}>
                        <MaterialIcons name="music-note" size={40} color="#666" />
                      </View>
                    )}
                    <Text style={styles.playerTitle} numberOfLines={2}>
                      {playingSong.title}
                    </Text>
                    <Text style={styles.playerArtist} numberOfLines={1}>
                      {playingSong.artist}
                    </Text>
                  </View>

                  <View style={styles.webviewContainer}>
                    <WebView
                      source={{ html: getPlayerHtml(playingSong.embedUrl) }}
                      style={styles.webview}
                      allowsInlineMediaPlayback={true}
                      mediaPlaybackRequiresUserAction={false}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      allowsFullscreenVideo={true}
                      mixedContentMode="always"
                      onError={(e) => console.log('WebView error:', e.nativeEvent)}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: BRAND.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.primary,
  },
  sectionHint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 16,
  },

  // Songs Grid
  songsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  songCard: {
    width: CARD_WIDTH,
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardArtwork: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#E8E8E8',
  },
  cardArtworkPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    padding: 10,
    gap: 2,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardArtist: {
    fontSize: 10,
    color: '#666',
  },

  // Add Card
  addCard: {
    width: CARD_WIDTH,
    aspectRatio: 0.85,
    backgroundColor: BRAND.primaryMuted,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BRAND.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.primary,
  },

  // Search Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    paddingVertical: 12,
  },
  songList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  searchSongArtwork: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#E8E8E8',
  },
  noArtwork: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSongInfo: {
    flex: 1,
    gap: 3,
  },
  searchSongTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  searchSongArtist: {
    fontSize: 13,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },

  // Music Player Modal
  playerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  playerSheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  playerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
  },
  playerCloseBtn: {
    position: 'absolute',
    right: 16,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  playerArtwork: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#333',
    marginBottom: 20,
  },
  playerArtworkPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  playerArtist: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  webviewContainer: {
    height: 166,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
});
