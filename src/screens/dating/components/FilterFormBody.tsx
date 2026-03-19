import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating/strings';
import {
  PreferencesAgeRangeSection,
  PreferencesGenderSection,
  PreferencesDistanceSection,
  PreferencesSameYearSection,
  type AgeRangeValue,
} from '../onboarding/components';
import type { DatingGenderPreference } from '../../../types/dating';
import { MajorDropdownBlock } from './MajorDropdownBlock';

const colors = DATING_COLORS.preferences;
const strings = DATING_STRINGS.discovery;

export const FILTER_SECTION_IDS = ['distance', 'lookingFor', 'age', 'major', 'sameYear'] as const;
export type SectionId = (typeof FILTER_SECTION_IDS)[number];

const SECTION_TITLES: Record<SectionId, string> = {
  distance: strings.filterSectionDistance,
  lookingFor: strings.filterSectionLookingFor,
  age: strings.filterSectionAge,
  major: strings.filterSectionMajor,
  sameYear: strings.filterSectionSameYear,
};

const SCROLL_PADDING_BOTTOM = 24;
const SECTION_HEADER_PADDING_H = 20;
const SECTION_HEADER_PADDING_V = 14;
const SECTION_BODY_PADDING_H = 16;
const SECTION_BODY_PADDING_BOTTOM = 16;
const CHEVRON_SIZE = 24;

export interface FilterFormBodyProps {
  expandedSections: Set<SectionId>;
  onToggleSection: (id: SectionId) => void;
  preferredGender: DatingGenderPreference | null;
  onPreferredGenderChange: (v: DatingGenderPreference | null) => void;
  maxDistanceKm: number | null;
  onMaxDistanceChange: (v: number | null) => void;
  ageRange: AgeRangeValue;
  onAgeRangeChange: (v: AgeRangeValue) => void;
  selectedMajor: string | null;
  onSelectedMajorChange: (v: string | null) => void;
  majorDropdownOpen: boolean;
  onMajorDropdownOpenChange: (open: boolean) => void;
  sameYearOnly: boolean;
  onSameYearOnlyChange: (v: boolean) => void;
}

export const FilterFormBody = React.memo<FilterFormBodyProps>((props) => {
  const {
    expandedSections,
    onToggleSection,
    preferredGender,
    onPreferredGenderChange,
    maxDistanceKm,
    onMaxDistanceChange,
    ageRange,
    onAgeRangeChange,
    selectedMajor,
    onSelectedMajorChange,
    majorDropdownOpen,
    onMajorDropdownOpenChange,
    sameYearOnly,
    onSameYearOnlyChange,
  } = props;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {FILTER_SECTION_IDS.map((id) => {
        const isExpanded = expandedSections.has(id);
        return (
          <View key={id} style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => onToggleSection(id)}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>{SECTION_TITLES[id]}</Text>
              <MaterialIcons
                name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={CHEVRON_SIZE}
                color={colors.sectionTitle}
              />
            </TouchableOpacity>
            {isExpanded && (
              <View style={styles.sectionBody}>
                {id === 'distance' && (
                  <PreferencesDistanceSection value={maxDistanceKm} onChange={onMaxDistanceChange} />
                )}
                {id === 'lookingFor' && (
                  <PreferencesGenderSection
                    value={preferredGender}
                    onChange={onPreferredGenderChange}
                  />
                )}
                {id === 'age' && (
                  <PreferencesAgeRangeSection value={ageRange} onChange={onAgeRangeChange} />
                )}
                {id === 'major' && (
                  <MajorDropdownBlock
                    value={selectedMajor}
                    onChange={onSelectedMajorChange}
                    open={majorDropdownOpen}
                    onOpenChange={onMajorDropdownOpenChange}
                  />
                )}
                {id === 'sameYear' && (
                  <PreferencesSameYearSection
                    value={sameYearOnly}
                    onValueChange={onSameYearOnlyChange}
                  />
                )}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: SCROLL_PADDING_BOTTOM },
  section: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SECTION_HEADER_PADDING_H,
    paddingVertical: SECTION_HEADER_PADDING_V,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.sectionTitle,
  },
  sectionBody: {
    paddingHorizontal: SECTION_BODY_PADDING_H,
    paddingBottom: SECTION_BODY_PADDING_BOTTOM,
  },
});
