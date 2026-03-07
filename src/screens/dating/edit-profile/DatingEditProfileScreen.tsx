import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import {
  DATING_COLORS,
  DATING_SPACING,
} from '../../../constants/dating';
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
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'Nguyễn Văn A',
    age: 21,
    bio: '',
    photos: [],
    basicInfo: {
      location: 'Hà Đông, Hà Nội',
      gender: 'Nam',
      relationshipStatus: 'Không rõ',
    },
    workEducation: {
      school: 'Học viện Công nghệ PTIT',
      job: 'Mobile Developer',
      company: 'Google',
    },
    lifestyle: {
      religion: 'Không rõ',
      smoking: 'Hút thuốc',
      drinking: 'Hót thuốc',
    },
    interests: ['Bóng đá', 'Nghề mĩ', 'Du lịch', 'Lập trình', 'Chụp ảnh'],
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
          <WorkEducationSection data={profileData.workEducation} />

          {/* Lifestyle */}
          <LifestyleSection data={profileData.lifestyle} />

          {/* Interests */}
          <InterestsSection
            interests={profileData.interests}
            onUpdate={handleInterestsUpdate}
          />

          <View style={{ height: DATING_SPACING.huge }} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.previewContainer}>
            {/* Preview content - will be implemented */}
          </View>
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
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DatingEditProfileScreen;
