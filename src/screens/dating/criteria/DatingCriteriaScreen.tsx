import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
  Text,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  DATING_COLORS,
  DATING_SPACING,
  DATING_FONT_SIZE,
  DATING_RADIUS,
} from '../../../constants/dating';
import { datingService } from '../../../services/dating/datingService';
import type { UpdatePreferencesInput, DatingGenderPreference } from '../../../types/dating';

interface CriteriaData {
  // "I only want to see..."
  gender?: DatingGenderPreference | null;
  locations: string[];
  maxDistance?: number;
  ageMin: number;
  ageMax: number;

  // "I'm interested in..." (future - currently placeholder UI)
  lookingFor?: string;
  heightMin?: number;
  heightMax?: number;
  languages: string[];
  education?: string;
  childrenStatus?: string;
  smoking?: string;
  drinking?: string;
  religion?: string;
}

const GENDERS = [
  { label: 'Nữ', value: 'FEMALE' },
  { label: 'Nam', value: 'MALE' },
  { label: 'Khác', value: 'OTHER' },
];

const LOOKING_FOR = ['Tùy ý', 'Hẹn hò', 'Mối quan hệ'];
const LANGUAGES = ['Tiếng Việt', 'Tiếng Anh', 'Tiếng Trung', 'Khác'];
const EDUCATIONS = [
  'Chưa học xong cấp 3',
  'Bằng trung học',
  'Bằng cao đẳng',
  'Bằng đại học',
  'Bằng thạc sĩ/Tiến sĩ',
];
const CHILDREN_STATUS = ['Chưa có con', 'Có con', 'Muốn có con trong tương lai', 'Không quan tâm'];
const SMOKING = ['Không bao giờ', 'Thỉnh thoảng', 'Thường xuyên'];
const DRINKING = ['Không bao giờ', 'Thỉnh thoảng', 'Thường xuyên'];
const RELIGIONS = ['Không có tôn giáo', 'Phật giáo', 'Công giáo', 'Hồi giáo', 'Khác'];
const LOCATIONS = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];

export const DatingCriteriaScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [criteria, setCriteria] = useState<CriteriaData>({
    gender: undefined,
    locations: [],
    maxDistance: 50,
    ageMin: 18,
    ageMax: 30,
    lookingFor: undefined,
    heightMin: 150,
    heightMax: 180,
    languages: [],
    education: undefined,
    childrenStatus: undefined,
    smoking: undefined,
    drinking: undefined,
    religion: undefined,
  });

  // Modals
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [lookingForModalVisible, setLookingForModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [educationModalVisible, setEducationModalVisible] = useState(false);
  const [childrenModalVisible, setChildrenModalVisible] = useState(false);
  const [smokingModalVisible, setSmokingModalVisible] = useState(false);
  const [drinkingModalVisible, setDrinkingModalVisible] = useState(false);
  const [religionModalVisible, setReligionModalVisible] = useState(false);

  // Load existing preferences on mount
  useFocusEffect(
    useCallback(() => {
      loadPreferences();
    }, [])
  );

  const loadPreferences = async () => {
    try {
      setIsInitialLoading(true);
      const profile = await datingService.getMyProfile();
      
      if (profile.preferences) {
        setCriteria((prev) => ({
          ...prev,
          ageMin: profile.preferences!.ageMin || 18,
          ageMax: profile.preferences!.ageMax || 30,
          maxDistance: profile.preferences!.maxDistance || 50,
          gender: profile.preferences!.gender,
        }));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Continue with default values
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleGenderSelect = useCallback((gender: string) => {
    setCriteria((prev) => ({ 
      ...prev, 
      gender: gender === prev.gender ? undefined : (gender as DatingGenderPreference) 
    }));
    setGenderModalVisible(false);
  }, []);

  const handleLocationSelect = useCallback((location: string) => {
    setCriteria((prev) => {
      const locations = prev.locations.includes(location)
        ? prev.locations.filter((l) => l !== location)
        : [...prev.locations, location];
      return { ...prev, locations };
    });
  }, []);

  const handleLookingForSelect = useCallback((value: string) => {
    setCriteria((prev) => ({ ...prev, lookingFor: value === prev.lookingFor ? undefined : value }));
    setLookingForModalVisible(false);
  }, []);

  const handleLanguageSelect = useCallback((language: string) => {
    setCriteria((prev) => {
      const languages = prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language];
      return { ...prev, languages };
    });
  }, []);

  const handleEducationSelect = useCallback((education: string) => {
    setCriteria((prev) => ({ ...prev, education: education === prev.education ? undefined : education }));
    setEducationModalVisible(false);
  }, []);

  const handleChildrenSelect = useCallback((value: string) => {
    setCriteria((prev) => ({ ...prev, childrenStatus: value === prev.childrenStatus ? undefined : value }));
    setChildrenModalVisible(false);
  }, []);

  const handleSmokingSelect = useCallback((value: string) => {
    setCriteria((prev) => ({ ...prev, smoking: value === prev.smoking ? undefined : value }));
    setSmokingModalVisible(false);
  }, []);

  const handleDrinkingSelect = useCallback((value: string) => {
    setCriteria((prev) => ({ ...prev, drinking: value === prev.drinking ? undefined : value }));
    setDrinkingModalVisible(false);
  }, []);

  const handleReligionSelect = useCallback((value: string) => {
    setCriteria((prev) => ({ ...prev, religion: value === prev.religion ? undefined : value }));
    setReligionModalVisible(false);
  }, []);

  const handleSaveCriteria = useCallback(async () => {
    if (criteria.ageMin > criteria.ageMax) {
      Alert.alert('Lỗi', 'Độ tuổi tối thiểu phải nhỏ hơn hoặc bằng độ tuổi tối đa');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: UpdatePreferencesInput = {
        ageMin: criteria.ageMin,
        ageMax: criteria.ageMax,
        maxDistance: criteria.maxDistance,
        gender: criteria.gender as any,
      };

      console.log('Saving preferences:', updateData);
      await datingService.updatePreferences(updateData);
      
      Alert.alert('Thành công', 'Tiêu chí hẹn hò đã được lưu!');
      console.log('✅ Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Lỗi', 'Không thể lưu tiêu chí hẹn hò. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [criteria]);

  if (isInitialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: DATING_COLORS.light.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={DATING_COLORS.light.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DATING_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: DATING_COLORS.light.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={DATING_COLORS.light.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tiêu chí hẹn hò</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section 1: I only want to see... */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tôi chỉ muốn nhìn thấy...</Text>

          {/* Gender */}
          <CriteriaFieldButton
            icon="heart-outline"
            label="Giới tính"
            value={criteria.gender ? (GENDERS.find((g) => g.value === criteria.gender)?.label || 'Chọn') : 'Chọn'}
            onPress={() => setGenderModalVisible(true)}
          />

          {/* Locations */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <Ionicons name="location-outline" size={20} color={DATING_COLORS.primary} />
              <Text style={styles.label}>Vị trí Hẹn hò</Text>
            </View>
            <Pressable
              style={styles.selectableFieldValue}
              onPress={() => setLocationModalVisible(true)}
            >
              <Text style={styles.value}>
                {criteria.locations.length > 0
                  ? `${criteria.locations.join(', ')}`
                  : 'Chọn vị trí'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={DATING_COLORS.light.textSecondary} />
            </Pressable>
          </View>

          {/* Distance */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabelWithValue}>
              <View style={styles.fieldLabel}>
                <Ionicons name="compass-outline" size={20} color={DATING_COLORS.primary} />
                <Text style={styles.label}>Khoảng cách</Text>
              </View>
              <Text style={styles.sliderValue}>Trong vòng {criteria.maxDistance} km</Text>
            </View>
            <View style={styles.numberInputContainer}>
              <TextInput
                style={styles.numberInput}
                value={String(criteria.maxDistance || 50)}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num) && num >= 1 && num <= 500) {
                    setCriteria((prev) => ({ ...prev, maxDistance: num }));
                  }
                }}
                keyboardType="number-pad"
                placeholder="Km"
                placeholderTextColor={DATING_COLORS.light.textSecondary}
              />
            </View>
          </View>

          {/* Age Range */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabelWithValue}>
              <View style={styles.fieldLabel}>
                <Ionicons name="calendar-outline" size={20} color={DATING_COLORS.primary} />
                <Text style={styles.label}>Độ tuổi</Text>
              </View>
              <Text style={styles.sliderValue}>
                {criteria.ageMin} – {criteria.ageMax}
              </Text>
            </View>

            {/* Age Min */}
            <View style={styles.rangeContainer}>
              <Text style={styles.rangeLabel}>Tối thiểu</Text>
              <TextInput
                style={styles.numberInput}
                value={String(criteria.ageMin)}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num) && num >= 18 && num <= 99) {
                    setCriteria((prev) => ({
                      ...prev,
                      ageMin: Math.min(num, prev.ageMax),
                    }));
                  }
                }}
                keyboardType="number-pad"
                placeholder="18"
                placeholderTextColor={DATING_COLORS.light.textSecondary}
              />
            </View>

            {/* Age Max */}
            <View style={styles.rangeContainer}>
              <Text style={styles.rangeLabel}>Tối đa</Text>
              <TextInput
                style={styles.numberInput}
                value={String(criteria.ageMax)}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num) && num >= 18 && num <= 99) {
                    setCriteria((prev) => ({
                      ...prev,
                      ageMax: Math.max(num, prev.ageMin),
                    }));
                  }
                }}
                keyboardType="number-pad"
                placeholder="99"
                placeholderTextColor={DATING_COLORS.light.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Section 2: I'm interested in... */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tôi quan tâm đến...</Text>
          <Text style={styles.sectionHint}>
            Sử dụng các tiêu chí này để lọc người dùng phù hợp nhất với bạn.
          </Text>

          {/* Looking For */}
          <CriteriaFieldButton
            icon="search-outline"
            label="Đang tìm"
            value={criteria.lookingFor || 'Tùy ý'}
            onPress={() => setLookingForModalVisible(true)}
          />

          {/* Height */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabelWithValue}>
              <View style={styles.fieldLabel}>
                <Ionicons name="resize-outline" size={20} color={DATING_COLORS.primary} />
                <Text style={styles.label}>Chiều cao</Text>
              </View>
              <Text style={styles.sliderValue}>
                {criteria.heightMin} cm – {criteria.heightMax} cm
              </Text>
            </View>

            {/* Height Min */}
            <View style={styles.rangeContainer}>
              <Text style={styles.rangeLabel}>Tối thiểu</Text>
              <TextInput
                style={styles.numberInput}
                value={String(criteria.heightMin || 150)}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num) && num >= 140 && num <= 220) {
                    setCriteria((prev) => ({
                      ...prev,
                      heightMin: Math.min(num, prev.heightMax || 220),
                    }));
                  }
                }}
                keyboardType="number-pad"
                placeholder="150"
                placeholderTextColor={DATING_COLORS.light.textSecondary}
              />
            </View>

            {/* Height Max */}
            <View style={styles.rangeContainer}>
              <Text style={styles.rangeLabel}>Tối đa</Text>
              <TextInput
                style={styles.numberInput}
                value={String(criteria.heightMax || 180)}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num) && num >= 140 && num <= 220) {
                    setCriteria((prev) => ({
                      ...prev,
                      heightMax: Math.max(num, prev.heightMin || 140),
                    }));
                  }
                }}
                keyboardType="number-pad"
                placeholder="180"
                placeholderTextColor={DATING_COLORS.light.textSecondary}
              />
            </View>
          </View>

          {/* Languages */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <Ionicons name="language-outline" size={20} color={DATING_COLORS.primary} />
              <Text style={styles.label}>Ngôn ngữ sử dụng</Text>
            </View>
            <Pressable
              style={styles.selectableFieldValue}
              onPress={() => setLanguageModalVisible(true)}
            >
              <Text style={styles.value}>
                {criteria.languages.length > 0 ? criteria.languages.join(', ') : 'Tùy ý'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={DATING_COLORS.light.textSecondary} />
            </Pressable>
          </View>

          {/* Education */}
          <CriteriaFieldButton
            icon="school-outline"
            label="Trình độ học vấn"
            value={criteria.education || 'Tùy ý'}
            onPress={() => setEducationModalVisible(true)}
          />

          {/* Children Status */}
          <CriteriaFieldButton
            icon="happy-outline"
            label="Con cái"
            value={criteria.childrenStatus || 'Tùy ý'}
            onPress={() => setChildrenModalVisible(true)}
          />

          {/* Smoking */}
          <CriteriaFieldButton
            icon="flame-outline"
            label="Hút thuốc"
            value={criteria.smoking || 'Tùy ý'}
            onPress={() => setSmokingModalVisible(true)}
          />

          {/* Drinking */}
          <CriteriaFieldButton
            icon="wine-outline"
            label="Uống rượu"
            value={criteria.drinking || 'Tùy ý'}
            onPress={() => setDrinkingModalVisible(true)}
          />

          {/* Religion */}
          <CriteriaFieldButton
            icon="build-outline"
            label="Quán điểm tôn giáo"
            value={criteria.religion || 'Tùy ý'}
            onPress={() => setReligionModalVisible(true)}
          />
        </View>

        {/* Save Button */}
        <View style={styles.buttonSection}>
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed,
              isLoading && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveCriteria}
            disabled={isLoading}
            hitSlop={10}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Lưu tiêu chí</Text>
            )}
          </Pressable>
        </View>

        <View style={{ height: DATING_SPACING.huge }} />
      </ScrollView>

      {/* Modals */}
      <OptionsModal
        visible={genderModalVisible}
        title="Chọn giới tính"
        options={GENDERS.map((g) => ({ label: g.label, value: g.value }))}
        selectedValue={criteria.gender}
        onSelect={handleGenderSelect}
        onClose={() => setGenderModalVisible(false)}
      />

      <LocationsModal
        visible={locationModalVisible}
        selectedLocations={criteria.locations}
        onSelect={handleLocationSelect}
        onClose={() => setLocationModalVisible(false)}
      />

      <OptionsModal
        visible={lookingForModalVisible}
        title="Đang tìm"
        options={LOOKING_FOR.map((l) => ({ label: l, value: l }))}
        selectedValue={criteria.lookingFor}
        onSelect={handleLookingForSelect}
        onClose={() => setLookingForModalVisible(false)}
      />

      <MultiSelectModal
        visible={languageModalVisible}
        title="Chọn ngôn ngữ"
        options={LANGUAGES.map((l) => ({ label: l, value: l }))}
        selectedValues={criteria.languages}
        onSelect={handleLanguageSelect}
        onClose={() => setLanguageModalVisible(false)}
      />

      <OptionsModal
        visible={educationModalVisible}
        title="Trình độ học vấn"
        options={EDUCATIONS.map((e) => ({ label: e, value: e }))}
        selectedValue={criteria.education}
        onSelect={handleEducationSelect}
        onClose={() => setEducationModalVisible(false)}
      />

      <OptionsModal
        visible={childrenModalVisible}
        title="Con cái"
        options={CHILDREN_STATUS.map((c) => ({ label: c, value: c }))}
        selectedValue={criteria.childrenStatus}
        onSelect={handleChildrenSelect}
        onClose={() => setChildrenModalVisible(false)}
      />

      <OptionsModal
        visible={smokingModalVisible}
        title="Hút thuốc"
        options={SMOKING.map((s) => ({ label: s, value: s }))}
        selectedValue={criteria.smoking}
        onSelect={handleSmokingSelect}
        onClose={() => setSmokingModalVisible(false)}
      />

      <OptionsModal
        visible={drinkingModalVisible}
        title="Uống rượu"
        options={DRINKING.map((d) => ({ label: d, value: d }))}
        selectedValue={criteria.drinking}
        onSelect={handleDrinkingSelect}
        onClose={() => setDrinkingModalVisible(false)}
      />

      <OptionsModal
        visible={religionModalVisible}
        title="Quán điểm tôn giáo"
        options={RELIGIONS.map((r) => ({ label: r, value: r }))}
        selectedValue={criteria.religion}
        onSelect={handleReligionSelect}
        onClose={() => setReligionModalVisible(false)}
      />
    </SafeAreaView>
  );
};

// ---------- Helper Components ----------

interface CriteriaFieldButtonProps {
  icon: string;
  label: string;
  value: string;
  onPress: () => void;
}

const CriteriaFieldButton: React.FC<CriteriaFieldButtonProps> = ({
  icon,
  label,
  value,
  onPress,
}) => (
  <View style={styles.fieldContainer}>
    <View style={styles.fieldLabel}>
      <Ionicons name={icon as any} size={20} color={DATING_COLORS.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
    <Pressable style={styles.selectableFieldValue} onPress={onPress}>
      <Text style={[styles.value, value === 'Tùy ý' && styles.valueSecondary]}>
        {value}
      </Text>
      <Ionicons name="chevron-forward" size={20} color={DATING_COLORS.light.textSecondary} />
    </Pressable>
  </View>
);

interface OptionsModalProps {
  visible: boolean;
  title: string;
  options: Array<{ label: string; value: string }>;
  selectedValue?: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const OptionsModal: React.FC<OptionsModalProps> = ({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={DATING_COLORS.light.textPrimary} />
          </Pressable>
        </View>

        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.modalOption,
                selectedValue === item.value && styles.modalOptionSelected,
              ]}
              onPress={() => onSelect(item.value)}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  selectedValue === item.value && styles.modalOptionTextSelected,
                ]}
              >
                {item.label}
              </Text>
              {selectedValue === item.value && (
                <Ionicons name="checkmark" size={20} color={DATING_COLORS.primary} />
              )}
            </Pressable>
          )}
        />
      </View>
    </View>
  </Modal>
);

interface LocationsModalProps {
  visible: boolean;
  selectedLocations: string[];
  onSelect: (location: string) => void;
  onClose: () => void;
}

const LocationsModal: React.FC<LocationsModalProps> = ({
  visible,
  selectedLocations,
  onSelect,
  onClose,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Vị trí Hẹn hò</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={DATING_COLORS.light.textPrimary} />
          </Pressable>
        </View>

        <FlatList
          data={LOCATIONS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.modalOption,
                selectedLocations.includes(item) && styles.modalOptionSelected,
              ]}
              onPress={() => onSelect(item)}
            >
              <View style={styles.checkboxContainer}>
                <View
                  style={[
                    styles.checkbox,
                    selectedLocations.includes(item) && styles.checkboxChecked,
                  ]}
                >
                  {selectedLocations.includes(item) && (
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  )}
                </View>
              </View>
              <Text
                style={[
                  styles.modalOptionText,
                  selectedLocations.includes(item) && styles.modalOptionTextSelected,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </View>
  </Modal>
);

interface MultiSelectModalProps {
  visible: boolean;
  title: string;
  options: Array<{ label: string; value: string }>;
  selectedValues: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
}

const MultiSelectModal: React.FC<MultiSelectModalProps> = ({
  visible,
  title,
  options,
  selectedValues,
  onSelect,
  onClose,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={DATING_COLORS.light.textPrimary} />
          </Pressable>
        </View>

        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.modalOption,
                selectedValues.includes(item.value) && styles.modalOptionSelected,
              ]}
              onPress={() => onSelect(item.value)}
            >
              <View style={styles.checkboxContainer}>
                <View
                  style={[
                    styles.checkbox,
                    selectedValues.includes(item.value) && styles.checkboxChecked,
                  ]}
                >
                  {selectedValues.includes(item.value) && (
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  )}
                </View>
              </View>
              <Text
                style={[
                  styles.modalOptionText,
                  selectedValues.includes(item.value) && styles.modalOptionTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </View>
  </Modal>
);

// ---------- Styles ----------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DATING_COLORS.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: DATING_SPACING.lg,
    paddingVertical: DATING_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: DATING_COLORS.light.border,
  },
  headerTitle: {
    fontSize: DATING_FONT_SIZE.title,
    fontWeight: '700',
    color: DATING_COLORS.light.textPrimary,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: DATING_SPACING.lg,
    paddingTop: DATING_SPACING.lg,
  },
  section: {
    marginBottom: DATING_SPACING.xl,
  },
  sectionTitle: {
    fontSize: DATING_FONT_SIZE.title,
    fontWeight: '700',
    color: DATING_COLORS.light.textPrimary,
    marginBottom: DATING_SPACING.md,
  },
  sectionHint: {
    fontSize: DATING_FONT_SIZE.small,
    color: DATING_COLORS.light.textSecondary,
    marginBottom: DATING_SPACING.md,
    lineHeight: 18,
  },
  fieldContainer: {
    marginBottom: DATING_SPACING.lg,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DATING_SPACING.sm,
  },
  fieldLabelWithValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DATING_SPACING.md,
  },
  label: {
    fontSize: DATING_FONT_SIZE.body,
    fontWeight: '600',
    color: DATING_COLORS.light.textPrimary,
    marginLeft: DATING_SPACING.sm,
  },
  selectableFieldValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DATING_SPACING.md,
    paddingVertical: DATING_SPACING.sm,
    borderRadius: DATING_RADIUS.md,
    backgroundColor: DATING_COLORS.light.surface,
    borderWidth: 1,
    borderColor: DATING_COLORS.light.border,
  },
  value: {
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.light.textPrimary,
    fontWeight: '500',
  },
  valueSecondary: {
    color: DATING_COLORS.light.textSecondary,
  },
  sliderValue: {
    fontSize: DATING_FONT_SIZE.body,
    fontWeight: '600',
    color: DATING_COLORS.primary,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DATING_SPACING.sm,
  },
  numberInput: {
    flex: 1,
    paddingHorizontal: DATING_SPACING.md,
    paddingVertical: DATING_SPACING.sm,
    borderRadius: DATING_RADIUS.md,
    borderWidth: 1,
    borderColor: DATING_COLORS.light.border,
    backgroundColor: DATING_COLORS.light.surface,
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.light.textPrimary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeContainer: {
    marginBottom: DATING_SPACING.md,
  },
  rangeLabel: {
    fontSize: DATING_FONT_SIZE.small,
    color: DATING_COLORS.light.textSecondary,
    marginBottom: DATING_SPACING.sm,
  },
  buttonSection: {
    marginTop: DATING_SPACING.lg,
  },
  saveButton: {
    backgroundColor: DATING_COLORS.primary,
    borderRadius: DATING_RADIUS.full,
    paddingVertical: DATING_SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonPressed: {
    opacity: 0.7,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: DATING_FONT_SIZE.titleLarge,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DATING_COLORS.light.background,
    borderTopLeftRadius: DATING_RADIUS.xl,
    borderTopRightRadius: DATING_RADIUS.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DATING_SPACING.lg,
    paddingVertical: DATING_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: DATING_COLORS.light.border,
  },
  modalTitle: {
    fontSize: DATING_FONT_SIZE.title,
    fontWeight: '700',
    color: DATING_COLORS.light.textPrimary,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DATING_SPACING.lg,
    paddingVertical: DATING_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionSelected: {
    backgroundColor: `${DATING_COLORS.primary}10`,
  },
  modalOptionText: {
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.light.textPrimary,
    flex: 1,
  },
  modalOptionTextSelected: {
    fontWeight: '600',
  },
  checkboxContainer: {
    marginRight: DATING_SPACING.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: DATING_COLORS.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: DATING_COLORS.primary,
    borderColor: DATING_COLORS.primary,
  },
});
