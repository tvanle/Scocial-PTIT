import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import Avatar from '../../components/common/Avatar';
import { useAuthStore } from '../../store/slices/authSlice';
import { postService } from '../../services/post/postService';
import { useTheme } from '../../hooks/useThemeColors';
import { DEFAULT_AVATAR } from '../../constants/strings';

interface PollOption {
  id: string;
  text: string;
}

interface QuotedComment {
  id: string;
  content: string;
  author: {
    id: string;
    fullName: string;
    avatar?: string;
  };
  postId: string;
}

type CreatePostParams = {
  CreatePostModal: {
    quotedComment?: QuotedComment;
  };
};

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
  mimeType?: string;
}

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CreatePostParams, 'CreatePostModal'>>();
  const quotedComment = route.params?.quotedComment;
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Poll state
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ]);
  const [activePoll, setActivePoll] = useState<PollOption[] | null>(null);

  const pickImage = async () => {
    console.log('pickImage called');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission result:', permission);
      if (!permission.granted) {
        showAlert('Thông báo', 'Cần quyền truy cập thư viện ảnh');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10 - media.length,
      });
      console.log('ImagePicker result:', result);
      if (!result.canceled && result.assets) {
        const newMedia = result.assets.map(asset => ({
          uri: asset.uri,
          type: (asset.type === 'video' ? 'video' : 'image') as 'image' | 'video',
          mimeType: asset.mimeType,
        }));
        setMedia([...media, ...newMedia]);
      }
    } catch (error) {
      console.error('pickImage error:', error);
      showAlert('Lỗi', 'Không thể mở thư viện ảnh');
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showAlert('Thông báo', 'Cần quyền truy cập camera');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMedia([...media, {
        uri: asset.uri,
        type: 'image',
        mimeType: asset.mimeType,
      }]);
    }
  };

  const removeMedia = (index: number) => {
    const newMedia = [...media];
    newMedia.splice(index, 1);
    setMedia(newMedia);
  };

  // Poll functions
  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, { id: Date.now().toString(), text: '' }]);
    }
  };

  const removePollOption = (id: string) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter(opt => opt.id !== id));
    }
  };

  const updatePollOption = (id: string, text: string) => {
    setPollOptions(pollOptions.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  const savePoll = () => {
    const validOptions = pollOptions.filter(opt => opt.text.trim().length > 0);
    if (validOptions.length >= 2) {
      setActivePoll(validOptions);
      setShowPollModal(false);
    } else {
      showAlert('Thông báo', 'Cần ít nhất 2 lựa chọn cho bình chọn');
    }
  };

  const removePoll = () => {
    setActivePoll(null);
    setPollOptions([
      { id: '1', text: '' },
      { id: '2', text: '' },
    ]);
  };

  const handlePost = async () => {
    if (!content.trim() && media.length === 0 && !activePoll) {
      showAlert('Thông báo', 'Vui lòng nhập nội dung, thêm ảnh/video hoặc tạo bình chọn');
      return;
    }
    setIsLoading(true);
    try {
      // Upload media files first
      let mediaIds: string[] = [];
      if (media.length > 0) {
        console.log('Uploading media:', media.map(m => ({ uri: m.uri, mimeType: m.mimeType })));
        for (const item of media) {
          try {
            const uploaded = await postService.uploadMedia(item.uri, item.mimeType);
            console.log('Uploaded single media:', uploaded);
            mediaIds.push(uploaded.id);
          } catch (uploadError) {
            console.error('Single upload error:', uploadError);
            throw uploadError;
          }
        }
        console.log('All media IDs:', mediaIds);
      }

      console.log('Creating post with mediaIds:', mediaIds);
      const postData: any = {
        content: content.trim(),
        privacy: 'PUBLIC',
        mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
      };

      // Add poll if available
      if (activePoll) {
        postData.poll = {
          options: activePoll.map((opt, index) => ({
            text: opt.text,
            order: index,
          })),
        };
      }

      const newPost = await postService.createPost(postData);
      console.log('Post created:', newPost);
      navigation.goBack();
    } catch (error: any) {
      console.error('Create post error:', error);
      showAlert('Lỗi', error?.message || 'Không thể đăng bài viết. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const canPost = content.trim().length > 0 || media.length > 0 || activePoll !== null;

  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: colors.cardBackground,
    },
    cancelText: {
      fontSize: FontSize.md,
      color: colors.textPrimary,
    },
    headerTitle: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.bold,
      color: colors.textPrimary,
    },
    postText: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: colors.primary,
      textAlign: 'right' as const,
    },
    postTextDisabled: {
      color: colors.gray300,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderLight,
    },
    threadLine: {
      width: 2,
      flex: 1,
      backgroundColor: colors.borderLight,
      marginTop: Spacing.sm,
      borderRadius: 1,
    },
    userName: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: colors.textPrimary,
      marginBottom: Spacing.xxs,
    },
    textInput: {
      fontSize: FontSize.md,
      color: colors.textPrimary,
      minHeight: 80,
      textAlignVertical: 'top' as const,
      paddingVertical: Spacing.xs,
    },
    footer: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    footerText: {
      fontSize: FontSize.sm,
      color: colors.textTertiary,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={dynamicStyles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
            <Text style={dynamicStyles.cancelText}>Hủy</Text>
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>Thread mới</Text>
          <TouchableOpacity
            style={styles.postButton}
            onPress={handlePost}
            disabled={isLoading}
            activeOpacity={0.6}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[dynamicStyles.postText, !canPost && dynamicStyles.postTextDisabled]}>
                Đăng
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={dynamicStyles.divider} />

        {/* Content */}
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.threadContainer}>
            {/* Avatar + vertical line */}
            <View style={styles.leftColumn}>
              <Avatar
                uri={user?.avatar}
                name={user?.fullName}
                size="md"
              />
              <View style={dynamicStyles.threadLine} />
            </View>

            {/* Right content */}
            <View style={styles.rightColumn}>
              <Text style={dynamicStyles.userName}>{user?.fullName || 'Người dùng'}</Text>
              <TextInput
                ref={inputRef}
                style={dynamicStyles.textInput}
                placeholder="Có gì mới?"
                placeholderTextColor={colors.textTertiary}
                multiline
                value={content}
                onChangeText={setContent}
                autoFocus
              />

              {/* Quoted Comment */}
              {quotedComment && (
                <View style={[styles.quotedComment, { backgroundColor: colors.gray100, borderColor: colors.borderLight }]}>
                  <View style={styles.quotedHeader}>
                    <Image
                      source={{ uri: quotedComment.author.avatar || DEFAULT_AVATAR }}
                      style={styles.quotedAvatar}
                    />
                    <Text style={[styles.quotedAuthor, { color: colors.textPrimary }]}>
                      {quotedComment.author.fullName}
                    </Text>
                  </View>
                  <Text style={[styles.quotedContent, { color: colors.textSecondary }]} numberOfLines={3}>
                    {quotedComment.content}
                  </Text>
                </View>
              )}

              {/* Media Preview */}
              {media.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
                  {media.map((item, index) => (
                    <View key={index} style={styles.mediaItem}>
                      <Image source={{ uri: item.uri }} style={styles.mediaImage} />
                      <TouchableOpacity
                        style={styles.removeMediaButton}
                        onPress={() => removeMedia(index)}
                      >
                        <Ionicons name="close-circle" size={22} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Poll Preview */}
              {activePoll && (
                <View style={[styles.pollPreview, { backgroundColor: colors.gray100, borderColor: colors.borderLight }]}>
                  <View style={styles.pollPreviewHeader}>
                    <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
                    <Text style={[styles.pollPreviewTitle, { color: colors.textPrimary }]}>Bình chọn</Text>
                    <TouchableOpacity onPress={removePoll} style={styles.pollRemoveBtn}>
                      <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                  {activePoll.map((opt, index) => (
                    <View key={opt.id} style={[styles.pollOptionPreview, { borderColor: colors.borderLight }]}>
                      <Text style={[styles.pollOptionText, { color: colors.textSecondary }]}>{opt.text}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Media action icons */}
              <View style={styles.mediaActions}>
                <TouchableOpacity onPress={pickImage} style={styles.mediaActionBtn} activeOpacity={0.5}>
                  <Ionicons name="images-outline" size={24} color={colors.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={takePhoto} style={styles.mediaActionBtn} activeOpacity={0.5}>
                  <Ionicons name="camera-outline" size={24} color={colors.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => !activePoll && setShowPollModal(true)}
                  style={styles.mediaActionBtn}
                  activeOpacity={0.5}
                >
                  <Ionicons name="bar-chart-outline" size={24} color={activePoll ? colors.primary : colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={dynamicStyles.footer}>
          <Text style={dynamicStyles.footerText}>Bất kỳ ai cũng có thể trả lời và trích dẫn</Text>
        </View>
      </KeyboardAvoidingView>

      {/* Poll Modal - outside KeyboardAvoidingView */}
      <Modal
        visible={showPollModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPollModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowPollModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            {/* Handle bar */}
            <View style={[styles.modalHandle, { backgroundColor: colors.gray300 }]} />

            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
              <TouchableOpacity
                onPress={() => setShowPollModal(false)}
                style={styles.modalHeaderBtn}
              >
                <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Hủy</Text>
              </TouchableOpacity>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="bar-chart" size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Tạo bình chọn</Text>
              </View>
              <TouchableOpacity
                onPress={savePoll}
                style={[styles.modalHeaderBtn, styles.modalSaveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalSaveText}>Xong</Text>
              </TouchableOpacity>
            </View>

            {/* Body */}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.pollLabel, { color: colors.textSecondary }]}>
                Thêm các lựa chọn cho bình chọn của bạn
              </Text>

              {pollOptions.map((option, index) => (
                <View key={option.id} style={styles.pollInputRow}>
                  <View style={[styles.pollInputWrapper, { backgroundColor: colors.gray100, borderColor: colors.borderLight }]}>
                    <View style={[styles.pollInputNumber, { backgroundColor: colors.primary }]}>
                      <Text style={styles.pollInputNumberText}>{index + 1}</Text>
                    </View>
                    <TextInput
                      style={[styles.pollInput, { color: colors.textPrimary }]}
                      placeholder={`Nhập lựa chọn ${index + 1}`}
                      placeholderTextColor={colors.textTertiary}
                      value={option.text}
                      onChangeText={(text) => updatePollOption(option.id, text)}
                      maxLength={50}
                    />
                    {pollOptions.length > 2 && (
                      <TouchableOpacity
                        onPress={() => removePollOption(option.id)}
                        style={styles.pollRemoveOptionBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              {pollOptions.length < 4 && (
                <TouchableOpacity
                  onPress={addPollOption}
                  style={[styles.addOptionBtn, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '10' }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                  <Text style={[styles.addOptionText, { color: colors.primary }]}>Thêm lựa chọn</Text>
                </TouchableOpacity>
              )}

              <Text style={[styles.pollHint, { color: colors.textTertiary }]}>
                Tối thiểu 2 lựa chọn, tối đa 4 lựa chọn
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    height: 48,
  },
  headerSide: {
    minWidth: 50,
  },
  postButton: {
    minWidth: 50,
    alignItems: 'flex-end',
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.md,
  },
  scrollContent: {
    flex: 1,
  },
  threadContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  leftColumn: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rightColumn: {
    flex: 1,
    paddingBottom: Spacing.xl,
  },
  mediaScroll: {
    marginTop: Spacing.sm,
  },
  mediaItem: {
    position: 'relative',
    marginRight: Spacing.sm,
  },
  mediaImage: {
    width: 140,
    height: 140,
    borderRadius: BorderRadius.md,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 11,
  },
  mediaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  mediaActionBtn: {
    padding: Spacing.sm,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quotedComment: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  quotedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  quotedAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: Spacing.xs,
  },
  quotedAuthor: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  quotedContent: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  // Poll preview styles
  pollPreview: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  pollPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pollPreviewTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  pollRemoveBtn: {
    padding: 2,
  },
  pollOptionPreview: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  pollOptionText: {
    fontSize: FontSize.sm,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Spacing.huge,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalHeaderBtn: {
    minWidth: 60,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  modalCancel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  modalSaveBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },
  modalBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  pollLabel: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  pollInputRow: {
    marginBottom: Spacing.md,
  },
  pollInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pollInputNumber: {
    width: 32,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  pollInputNumberText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },
  pollInput: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  pollRemoveOptionBtn: {
    padding: Spacing.sm,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  addOptionText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  pollHint: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
});

export default CreatePostScreen;
