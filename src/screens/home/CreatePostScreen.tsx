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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import Avatar from '../../components/common/Avatar';

type Privacy = 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
}

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation();
  const inputRef = useRef<TextInput>(null);

  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [privacy, setPrivacy] = useState<Privacy>('PUBLIC');
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacyPicker, setShowPrivacyPicker] = useState(false);

  const privacyOptions = [
    { value: 'PUBLIC', label: 'Công khai', icon: 'globe-outline' },
    { value: 'FOLLOWERS', label: 'Người theo dõi', icon: 'people-outline' },
    { value: 'PRIVATE', label: 'Chỉ mình tôi', icon: 'lock-closed-outline' },
  ];

  const currentPrivacy = privacyOptions.find(p => p.value === privacy);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Thông báo', 'Cần quyền truy cập thư viện ảnh để thực hiện chức năng này');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - media.length,
    });

    if (!result.canceled && result.assets) {
      const newMedia = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
      })) as MediaItem[];
      setMedia([...media, ...newMedia]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Thông báo', 'Cần quyền truy cập camera để thực hiện chức năng này');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMedia([...media, { uri: result.assets[0].uri, type: 'image' }]);
    }
  };

  const removeMedia = (index: number) => {
    const newMedia = [...media];
    newMedia.splice(index, 1);
    setMedia(newMedia);
  };

  const handlePost = async () => {
    if (!content.trim() && media.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung hoặc thêm ảnh/video');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Call API to create post
      // const formData = new FormData();
      // formData.append('content', content);
      // formData.append('privacy', privacy);
      // media.forEach((item, index) => {
      //   formData.append('media', { uri: item.uri, type: 'image/jpeg', name: `media_${index}.jpg` });
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert('Thành công', 'Bài viết đã được đăng', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đăng bài viết. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const canPost = content.trim().length > 0 || media.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Tạo bài viết</Text>

          <TouchableOpacity
            style={[styles.postButton, !canPost && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={!canPost || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={[styles.postButtonText, !canPost && styles.postButtonTextDisabled]}>
                Đăng
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* User Info & Privacy */}
          <View style={styles.userSection}>
            <Avatar
              uri="https://i.pravatar.cc/150?img=3"
              size={48}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Nguyễn Văn A</Text>
              <TouchableOpacity
                style={styles.privacyButton}
                onPress={() => setShowPrivacyPicker(!showPrivacyPicker)}
              >
                <Ionicons
                  name={currentPrivacy?.icon as any}
                  size={14}
                  color={colors.text.secondary}
                />
                <Text style={styles.privacyText}>{currentPrivacy?.label}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Privacy Picker */}
          {showPrivacyPicker && (
            <View style={styles.privacyPicker}>
              {privacyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.privacyOption,
                    privacy === option.value && styles.privacyOptionActive,
                  ]}
                  onPress={() => {
                    setPrivacy(option.value as Privacy);
                    setShowPrivacyPicker(false);
                  }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={privacy === option.value ? colors.primary : colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.privacyOptionText,
                      privacy === option.value && styles.privacyOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {privacy === option.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Text Input */}
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Bạn đang nghĩ gì?"
            placeholderTextColor={colors.text.placeholder}
            multiline
            value={content}
            onChangeText={setContent}
            autoFocus
          />

          {/* Media Preview */}
          {media.length > 0 && (
            <View style={styles.mediaContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {media.map((item, index) => (
                  <View key={index} style={styles.mediaItem}>
                    <Image source={{ uri: item.uri }} style={styles.mediaImage} />
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={() => removeMedia(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.white} />
                    </TouchableOpacity>
                    {item.type === 'video' && (
                      <View style={styles.videoOverlay}>
                        <Ionicons name="play-circle" size={40} color={colors.white} />
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Text style={styles.addText}>Thêm vào bài viết</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
              <Ionicons name="images" size={24} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Vi tri', 'Tinh nang check-in vi tri dang phat trien')}>
              <Ionicons name="location" size={24} color={colors.error} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Gan the', 'Tinh nang gan the nguoi khac dang phat trien')}>
              <Ionicons name="person-add" size={24} color={colors.info} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Cam xuc', 'Tinh nang them cam xuc dang phat trien')}>
              <Ionicons name="happy" size={24} color={colors.warning} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  postButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 70,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  postButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  postButtonTextDisabled: {
    color: colors.gray[500],
  },
  content: {
    flex: 1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  userInfo: {
    marginLeft: spacing.sm,
  },
  userName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    gap: 4,
  },
  privacyText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  privacyPicker: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  privacyOptionActive: {
    backgroundColor: colors.primary + '10',
  },
  privacyOptionText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  privacyOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  textInput: {
    ...typography.body,
    color: colors.text.primary,
    padding: spacing.md,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  mediaContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  mediaItem: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  mediaImage: {
    width: 150,
    height: 150,
    borderRadius: borderRadius.md,
  },
  removeMediaButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: borderRadius.md,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  addText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
  },
});

export default CreatePostScreen;
