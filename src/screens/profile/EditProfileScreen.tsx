import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../utils/alert';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { userService } from '../../services/user/userService';
import { DEFAULT_AVATAR } from '../../constants/strings';
import { getImageUrl } from '../../utils/image';
import { useTheme } from '../../hooks/useThemeColors';

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuthStore();
  const { colors } = useTheme();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [faculty, setFaculty] = useState(user?.faculty || '');
  const [className, setClassName] = useState(user?.className || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Thông báo', 'Cần quyền truy cập thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      showAlert('Lỗi', 'Tên không được để trống');
      return;
    }

    setIsLoading(true);
    try {
      // Upload avatar if user picked a new image
      let newAvatarUrl: string | undefined;
      if (avatar && avatar.startsWith('file://')) {
        newAvatarUrl = await userService.uploadAvatar(avatar);
      }

      const updatedUser = await userService.updateProfile({ fullName, bio, phone, faculty, className });

      // Only override avatar if we uploaded a new one
      if (newAvatarUrl) {
        updateUser({ ...updatedUser, avatar: newAvatarUrl });
      } else {
        updateUser(updatedUser);
      }

      showAlert('Thành công', 'Đã cập nhật trang cá nhân', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      showAlert('Lỗi', 'Không thể cập nhật. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.gray200 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Chỉnh sửa trang cá nhân</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          style={styles.headerButton}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Text style={[styles.saveText, { color: colors.textPrimary }]}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Avatar */}
          <TouchableOpacity style={styles.avatarSection} onPress={pickAvatar}>
            <Image
              source={{ uri: avatar.startsWith('file://') ? avatar : (getImageUrl(avatar) || DEFAULT_AVATAR) }}
              style={[styles.avatar, { backgroundColor: colors.gray200 }]}
            />
            <View style={[styles.cameraIcon, { backgroundColor: colors.textPrimary, borderColor: colors.background }]}>
              <Ionicons name="camera" size={16} color={colors.background} />
            </View>
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Tên</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.gray100, borderColor: colors.gray200 }]}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nhập tên của bạn"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Tiểu sử</Text>
              <View style={[styles.inputContainer, styles.bioInputContainer, { backgroundColor: colors.gray100, borderColor: colors.gray200 }]}>
                <TextInput
                  style={[styles.input, styles.bioInput, { color: colors.textPrimary }]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Viết gì đó về bản thân..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  maxLength={150}
                />
              </View>
              <Text style={[styles.charCount, { color: colors.textSecondary }]}>{bio.length}/150</Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Số điện thoại</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.gray100, borderColor: colors.gray200 }]}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Khoa</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.gray100, borderColor: colors.gray200 }]}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={faculty}
                  onChangeText={setFaculty}
                  placeholder="VD: Công nghệ Thông tin"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Lớp</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.gray100, borderColor: colors.gray200 }]}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={className}
                  onChangeText={setClassName}
                  placeholder="VD: D21CQCN01-N"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    height: Layout.headerHeight,
    borderBottomWidth: 0.5,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
  },
  saveText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  content: {
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: '37%',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  form: {
    paddingHorizontal: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    height: Layout.inputHeight,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  bioInputContainer: {
    height: 100,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
  },
  input: {
    fontSize: FontSize.md,
  },
  bioInput: {
    height: '100%',
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: FontSize.xs,
    textAlign: 'right',
    marginTop: Spacing.xxs,
  },
});

export default EditProfileScreen;
