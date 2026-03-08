import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Pressable, Text, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DATING_COLORS,
  DATING_SPACING,
  DATING_FONT_SIZE,
  DATING_RADIUS,
} from '../../../constants/dating';
import { datingService } from '../../../services/dating/datingService';
import {
  EditProfileHeader,
  EditProfileTabs,
  PhotosSection,
  BioSection,
  BasicInfoSection,
  WorkEducationSection,
  LifestyleSection,
  InterestsSection,
} from './components';

type TabType = 'edit' | 'preview';

interface ProfileData {
  name: string;
  age: number;
  bio: string;
  photos: string[];
  basicInfo: {
    location: string;
    gender: string;
    relationshipStatus: string;
    height?: number;
    weight?: string;
  };
  workEducation: {
    school?: string;
    job?: string;
    company?: string;
  };
  lifestyle: {
    religion?: string;
    smoking?: string;
    drinking?: string;
    independence?: string;
  };
  interests: string[];
}

export const DatingEditProfileScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('edit');
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'Người dùng',
    age: 21,
    bio: 'Hãy giới thiệu bản thân của bạn',
    photos: [],
    basicInfo: {
      location: 'Hà Nội',
      gender: 'Chọn',
      relationshipStatus: 'Chọn',
      height: 175,
      weight: ''
    },
    workEducation: {
      school: '',
      job: '',
      company: '',
    },
    lifestyle: {
      religion: '',
      smoking: '',
      drinking: '',
      independence: '',
    },
    interests: [],
  });

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handlePhotosUpdate = useCallback((photos: string[]) => {
    setProfileData((prev) => ({ ...prev, photos }));
  }, []);

  const handleBioUpdate = useCallback((bio: string) => {
    setProfileData((prev) => ({ ...prev, bio }));
  }, []);

  const handleBasicInfoUpdate = useCallback((basicInfo: Partial<ProfileData['basicInfo']>) => {
    setProfileData((prev) => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, ...basicInfo },
    }));
  }, []);

  const handleInterestsUpdate = useCallback((interests: string[]) => {
    setProfileData((prev) => ({ ...prev, interests }));
  }, []);

  const handleWorkEducationUpdate = useCallback((workEducation: Partial<ProfileData['workEducation']>) => {
    setProfileData((prev) => ({
      ...prev,
      workEducation: { ...prev.workEducation, ...workEducation },
    }));
  }, []);

  const handleLifestyleUpdate = useCallback((lifestyle: Partial<ProfileData['lifestyle']>) => {
    setProfileData((prev) => ({
      ...prev,
      lifestyle: { ...prev.lifestyle, ...lifestyle },
    }));
  }, []);

  const handleSaveProfile = useCallback(async () => {
    console.log('=== handleSaveProfile called ===');
    console.log('Photos count:', profileData.photos.length);
    console.log('Profile data:', profileData);
    
    if (profileData.photos.length < 2) {
      Alert.alert('Cảnh báo', 'Vui lòng thêm ít nhất 2 ảnh');
      return;
    }

    setIsLoading(true);
    try {
      // Helper function to map Vietnamese text to API format
      const mapSmokingDrinking = (value: string | undefined): 'NEVER' | 'SOMETIMES' | 'REGULARLY' | undefined => {
        if (!value || value === 'Chọn') return undefined;
        if (value === 'Không') return 'NEVER';
        if (value === 'Thỉnh thoảng') return 'SOMETIMES';
        if (value === 'Thường xuyên') return 'REGULARLY';
        return undefined;
      };

      // Update profile bio
      await datingService.updateProfile({
        bio: profileData.bio,
      });
      console.log('✅ Profile updated successfully');

      // Update lifestyle
      await datingService.updateLifestyle({
        education: profileData.workEducation.school,
        job: profileData.workEducation.job,
        religion: profileData.lifestyle.religion !== 'Chọn' ? profileData.lifestyle.religion : undefined,
        smoking: mapSmokingDrinking(profileData.lifestyle.smoking),
        drinking: mapSmokingDrinking(profileData.lifestyle.drinking),
        height: profileData.basicInfo.height,
      });
      console.log('✅ Lifestyle updated successfully');

      Alert.alert('Thành công', 'Hồ sơ đã được lưu!');
      console.log('✅ Profile saved completely');
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      Alert.alert('Lỗi', 'Không thể lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [profileData]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: DATING_COLORS.light.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={DATING_COLORS.light.background} />

      <EditProfileHeader />

      {/* Tabs */}
      <EditProfileTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Content */}
      {activeTab === 'edit' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Photos Section */}
          <PhotosSection
            photos={profileData.photos}
            onPhotosUpdate={handlePhotosUpdate}
          />

          {/* Bio Section */}
          <BioSection
            bio={profileData.bio}
            onBioUpdate={handleBioUpdate}
          />

          {/* Basic Info */}
          <BasicInfoSection
            data={profileData.basicInfo}
            onUpdate={handleBasicInfoUpdate}
          />

          {/* Work & Education */}
          <WorkEducationSection 
            data={profileData.workEducation}
            onUpdate={handleWorkEducationUpdate}
          />

          {/* Lifestyle */}
          <LifestyleSection 
            data={profileData.lifestyle}
            onUpdate={handleLifestyleUpdate}
          />

          {/* Interests */}
          <InterestsSection
            interests={profileData.interests}
            onUpdate={handleInterestsUpdate}
          />

          {/* Save Button */}
          <View style={styles.buttonSection}>
            <Pressable 
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
                isLoading && styles.saveButtonDisabled
              ]}
              onPress={handleSaveProfile}
              disabled={isLoading}
              hitSlop={10}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Lưu hồ sơ</Text>
              )}
            </Pressable>
          </View>

          <View style={{ height: DATING_SPACING.huge }} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Main Photo */}
          {profileData.photos[0] ? (
            <Image
              source={{ uri: profileData.photos[0] }}
              style={styles.previewMainPhoto}
            />
          ) : (
            <View style={styles.previewMainPhotoPlaceholder}>
              <Ionicons name="image-outline" size={64} color={DATING_COLORS.light.border} />
            </View>
          )}

          {/* Profile Info */}
          <View style={styles.previewInfoSection}>
            <Text style={styles.previewName}>
              {profileData.name}, {profileData.age}
            </Text>
            <Text style={styles.previewLocation}>{profileData.basicInfo.location}</Text>
          </View>

          {/* Bio */}
          {profileData.bio && (
            <View style={styles.previewBioSection}>
              <Text style={styles.previewSectionTitle}>Về bạn</Text>
              <Text style={styles.previewBioText}>{profileData.bio}</Text>
            </View>
          )}

          {/* Work & Education */}
          {(profileData.workEducation.school || profileData.workEducation.job || profileData.workEducation.company) && (
            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Công việc & Học vấn</Text>
              {profileData.workEducation.school && (
                <View style={styles.previewItem}>
                  <Ionicons name="school-outline" size={16} color={DATING_COLORS.primary} />
                  <Text style={styles.previewItemText}>{profileData.workEducation.school}</Text>
                </View>
              )}
              {profileData.workEducation.job && (
                <View style={styles.previewItem}>
                  <Ionicons name="briefcase-outline" size={16} color={DATING_COLORS.primary} />
                  <Text style={styles.previewItemText}>{profileData.workEducation.job}</Text>
                </View>
              )}
              {profileData.workEducation.company && (
                <View style={styles.previewItem}>
                  <Ionicons name="business-outline" size={16} color={DATING_COLORS.primary} />
                  <Text style={styles.previewItemText}>{profileData.workEducation.company}</Text>
                </View>
              )}
            </View>
          )}

          {/* Lifestyle */}
          {(profileData.lifestyle.religion || profileData.lifestyle.smoking || profileData.lifestyle.drinking || profileData.basicInfo.height) && (
            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Lối sống</Text>
              {profileData.basicInfo.height && (
                <View style={styles.previewItem}>
                  <Ionicons name="resize-outline" size={16} color={DATING_COLORS.primary} />
                  <Text style={styles.previewItemText}>{profileData.basicInfo.height} cm</Text>
                </View>
              )}
              {profileData.lifestyle.religion && profileData.lifestyle.religion !== 'Chọn' && (
                <View style={styles.previewItem}>
                  <Ionicons name="heart-outline" size={16} color={DATING_COLORS.primary} />
                  <Text style={styles.previewItemText}>{profileData.lifestyle.religion}</Text>
                </View>
              )}
              {profileData.lifestyle.smoking && profileData.lifestyle.smoking !== 'Chọn' && (
                <View style={styles.previewItem}>
                  <Ionicons name="leaf-outline" size={16} color={DATING_COLORS.primary} />
                  <Text style={styles.previewItemText}>Hút thuốc: {profileData.lifestyle.smoking}</Text>
                </View>
              )}
              {profileData.lifestyle.drinking && profileData.lifestyle.drinking !== 'Chọn' && (
                <View style={styles.previewItem}>
                  <Ionicons name="wine-outline" size={16} color={DATING_COLORS.primary} />
                  <Text style={styles.previewItemText}>Uống rượu: {profileData.lifestyle.drinking}</Text>
                </View>
              )}
            </View>
          )}

          {/* Interests */}
          {profileData.interests.length > 0 && (
            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Sở thích</Text>
              <View style={styles.previewInterestsContainer}>
                {profileData.interests.map((interest) => (
                  <View key={interest} style={styles.previewInterestChip}>
                    <Text style={styles.previewInterestChipText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Additional Photos */}
          {profileData.photos.length > 1 && (
            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Các ảnh khác</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.previewPhotosGrid}
              >
                {profileData.photos.slice(1).map((photo, index) => (
                  <Image
                    key={index}
                    source={{ uri: photo }}
                    style={styles.previewPhotoThumbnail}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: DATING_SPACING.huge }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DATING_SPACING.lg,
    paddingTop: DATING_SPACING.md,
  },
  buttonSection: {
    marginTop: DATING_SPACING.lg,
    marginBottom: DATING_SPACING.md,
    width: '100%',
  },
  saveButton: {
    backgroundColor: DATING_COLORS.primary,
    borderRadius: DATING_RADIUS.lg,
    paddingVertical: DATING_SPACING.lg,
    paddingHorizontal: DATING_SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveButtonPressed: {
    opacity: 0.7,
    backgroundColor: '#cc2020',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: DATING_FONT_SIZE.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewMainPhoto: {
    width: '100%',
    height: 400,
    borderRadius: DATING_RADIUS.lg,
    marginBottom: DATING_SPACING.lg,
  },
  previewMainPhotoPlaceholder: {
    width: '100%',
    height: 400,
    borderRadius: DATING_RADIUS.lg,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DATING_SPACING.lg,
  },
  previewInfoSection: {
    marginBottom: DATING_SPACING.lg,
    paddingBottom: DATING_SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: DATING_COLORS.light.border,
  },
  previewName: {
    fontSize: DATING_FONT_SIZE.title,
    fontWeight: '700',
    color: DATING_COLORS.light.textPrimary,
    marginBottom: DATING_SPACING.xs,
  },
  previewLocation: {
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.light.textSecondary,
  },
  previewBioSection: {
    marginBottom: DATING_SPACING.lg,
    paddingBottom: DATING_SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: DATING_COLORS.light.border,
  },
  previewBioText: {
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.light.textPrimary,
    lineHeight: 22,
    marginTop: DATING_SPACING.sm,
  },
  previewSection: {
    marginBottom: DATING_SPACING.lg,
    paddingBottom: DATING_SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: DATING_COLORS.light.border,
  },
  previewSectionTitle: {
    fontSize: DATING_FONT_SIZE.body,
    fontWeight: '600',
    color: DATING_COLORS.light.textPrimary,
    marginBottom: DATING_SPACING.md,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DATING_SPACING.sm,
  },
  previewItemText: {
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.light.textPrimary,
    marginLeft: DATING_SPACING.md,
  },
  previewInterestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DATING_SPACING.sm,
  },
  previewInterestChip: {
    backgroundColor: DATING_COLORS.primary,
    borderRadius: DATING_RADIUS.md,
    paddingHorizontal: DATING_SPACING.md,
    paddingVertical: DATING_SPACING.sm,
  },
  previewInterestChipText: {
    fontSize: DATING_FONT_SIZE.small,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  previewPhotosGrid: {
    gap: DATING_SPACING.md,
    paddingRight: DATING_SPACING.lg,
  },
  previewPhotoThumbnail: {
    width: 120,
    height: 120,
    borderRadius: DATING_RADIUS.md,
  },
});

export default DatingEditProfileScreen;
