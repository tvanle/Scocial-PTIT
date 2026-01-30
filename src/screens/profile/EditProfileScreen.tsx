import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuthStore();

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
      Alert.alert('Thong bao', 'Can quyen truy cap thu vien anh');
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
      Alert.alert('Loi', 'Ten khong duoc de trong');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call API to update profile
      updateUser({ fullName, bio, phone, faculty, className, avatar });
      Alert.alert('Thanh cong', 'Da cap nhat trang ca nhan', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Loi', 'Khong the cap nhat. Vui long thu lai.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="close" size={28} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chinh sua trang ca nhan</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          style={styles.headerButton}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.black} />
          ) : (
            <Text style={styles.saveText}>Luu</Text>
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
              source={{ uri: avatar || 'https://i.pravatar.cc/150?img=1' }}
              style={styles.avatar}
            />
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Ten</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhap ten cua ban"
                placeholderTextColor={Colors.gray400}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Tieu su</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Viet gi do ve ban than..."
                placeholderTextColor={Colors.gray400}
                multiline
                maxLength={150}
              />
              <Text style={styles.charCount}>{bio.length}/150</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>So dien thoai</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Nhap so dien thoai"
                placeholderTextColor={Colors.gray400}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Khoa</Text>
              <TextInput
                style={styles.input}
                value={faculty}
                onChangeText={setFaculty}
                placeholder="VD: Cong nghe thong tin"
                placeholderTextColor={Colors.gray400}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Lop</Text>
              <TextInput
                style={styles.input}
                value={className}
                onChangeText={setClassName}
                placeholder="VD: D21CQCN01-N"
                placeholderTextColor={Colors.gray400}
              />
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
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    height: Layout.headerHeight,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.black,
  },
  saveText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.black,
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
    backgroundColor: Colors.gray200,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: '37%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
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
    color: Colors.gray500,
    marginBottom: Spacing.xs,
  },
  input: {
    fontSize: FontSize.md,
    color: Colors.black,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    textAlign: 'right',
    marginTop: Spacing.xxs,
  },
});

export default EditProfileScreen;
