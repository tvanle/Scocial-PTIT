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
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import Avatar from '../../components/common/Avatar';
import { useAuthStore } from '../../store/slices/authSlice';
import { postService } from '../../services/post/postService';

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
}

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const inputRef = useRef<TextInput>(null);

  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Thông báo', 'Cần quyền truy cập thư viện ảnh');
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
      Alert.alert('Thông báo', 'Cần quyền truy cập camera');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
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
      await postService.createPost({
        content: content.trim(),
        privacy: 'PUBLIC',
      });
      navigation.goBack();
    } catch (error: any) {
      console.error('Create post error:', error);
      Alert.alert('Lỗi', error?.message || 'Không thể đăng bài viết. Vui lòng thử lại.');
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
            <Text style={styles.cancelText}>Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thread mới</Text>
          <TouchableOpacity
            style={styles.postButton}
            onPress={handlePost}
            disabled={isLoading}
            activeOpacity={0.6}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={[styles.postText, !canPost && styles.postTextDisabled]}>
                Đăng
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Content */}
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.threadContainer}>
            {/* Avatar + vertical line */}
            <View style={styles.leftColumn}>
              <Avatar
                uri={user?.avatar}
                name={user?.fullName}
                size="md"
              />
              <View style={styles.threadLine} />
            </View>

            {/* Right content */}
            <View style={styles.rightColumn}>
              <Text style={styles.userName}>{user?.fullName || 'Người dùng'}</Text>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder="Có gì mới?"
                placeholderTextColor={Colors.textTertiary}
                multiline
                value={content}
                onChangeText={setContent}
                autoFocus
              />

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
                        <Ionicons name="close-circle" size={22} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Media action icons */}
              <View style={styles.mediaActions}>
                <TouchableOpacity onPress={pickImage} style={styles.mediaActionBtn}>
                  <Ionicons name="images-outline" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={takePhoto} style={styles.mediaActionBtn}>
                  <Ionicons name="camera-outline" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaActionBtn}>
                  <Text style={styles.gifText}>GIF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaActionBtn}>
                  <Ionicons name="bar-chart-outline" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaActionBtn}>
                  <Ionicons name="list-outline" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaActionBtn}>
                  <Ionicons name="location-outline" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Bất kỳ ai cũng có thể trả lời và trích dẫn</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
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
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  postText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textAlign: 'right',
  },
  postTextDisabled: {
    color: Colors.gray300,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
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
  threadLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.borderLight,
    marginTop: Spacing.sm,
    borderRadius: 1,
  },
  rightColumn: {
    flex: 1,
    paddingBottom: Spacing.xl,
  },
  userName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxs,
  },
  textInput: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingVertical: Spacing.xs,
    outlineStyle: 'none',
  } as any,
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
    gap: Spacing.md,
  },
  mediaActionBtn: {
    padding: Spacing.xxs,
  },
  gifText: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
    borderWidth: 1.5,
    borderColor: Colors.textTertiary,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
});

export default CreatePostScreen;
