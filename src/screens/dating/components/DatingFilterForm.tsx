import React, { useCallback, useEffect, useState } from 'react';
import { DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating/strings';
import { FilterFormHeader } from './FilterFormHeader';
import { FilterFormFooter } from './FilterFormFooter';
import { FilterFormBody, FILTER_SECTION_IDS, type SectionId } from './FilterFormBody';
import type { DatingFilterValues, DatingGenderPreference } from '../../../types/dating';
import type { AgeRangeValue } from '../onboarding/components';

const layoutAge = DATING_LAYOUT.preferences.ageRange;
const strings = DATING_STRINGS.discovery;

export interface DatingFilterFormProps {
  initialValues?: Partial<DatingFilterValues> | null;
  onApply: (values: DatingFilterValues) => void | Promise<void>;
  loading?: boolean;
  title?: string;
  applyLabel?: string;
  clearLabel?: string;
  expandAllLabel?: string;
}

export const DatingFilterForm: React.FC<DatingFilterFormProps> = ({
  initialValues,
  onApply,
  loading = false,
  title = strings.filterTitle,
  applyLabel = strings.filterApply,
  clearLabel = strings.filterClear,
  expandAllLabel = strings.filterExpandAll,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(['age']));
  const [preferredGender, setPreferredGender] = useState<DatingGenderPreference | null>(null);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);
  const [ageRange, setAgeRange] = useState<AgeRangeValue>({
    min: layoutAge.ageMinDefault,
    max: layoutAge.ageMaxDefault,
  });
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [majorDropdownOpen, setMajorDropdownOpen] = useState(false);
  const [sameYearOnly, setSameYearOnly] = useState(false);

  useEffect(() => {
    if (initialValues == null) return;
    setPreferredGender(initialValues.preferredGender ?? null);
    setMaxDistanceKm(initialValues.maxDistanceKm ?? null);
    setAgeRange({
      min: initialValues.ageMin ?? layoutAge.ageMinDefault,
      max: initialValues.ageMax ?? layoutAge.ageMaxDefault,
    });
    setSelectedMajor(initialValues.preferredMajor ?? null);
    setSameYearOnly(initialValues.sameYearOnly ?? false);
  }, [initialValues]);

  const toggleSection = useCallback((id: SectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedSections(new Set(FILTER_SECTION_IDS));
  }, []);

  const getValues = useCallback((): DatingFilterValues => ({
    preferredGender,
    maxDistanceKm,
    ageMin: ageRange.min,
    ageMax: ageRange.max,
    preferredMajor: selectedMajor,
    sameYearOnly,
  }), [preferredGender, maxDistanceKm, ageRange, selectedMajor, sameYearOnly]);

  const handleClear = useCallback(() => {
    setPreferredGender(null);
    setMaxDistanceKm(null);
    setAgeRange({ min: layoutAge.ageMinDefault, max: layoutAge.ageMaxDefault });
    setSelectedMajor(null);
    setSameYearOnly(false);
  }, []);

  const handleApply = useCallback(async () => {
    await onApply(getValues());
  }, [onApply, getValues]);

  return (
    <>
      <FilterFormHeader
        title={title}
        expandAllLabel={expandAllLabel}
        onExpandAll={expandAll}
      />
      <FilterFormBody
        expandedSections={expandedSections}
        onToggleSection={toggleSection}
        preferredGender={preferredGender}
        onPreferredGenderChange={setPreferredGender}
        maxDistanceKm={maxDistanceKm}
        onMaxDistanceChange={setMaxDistanceKm}
        ageRange={ageRange}
        onAgeRangeChange={setAgeRange}
        selectedMajor={selectedMajor}
        onSelectedMajorChange={setSelectedMajor}
        majorDropdownOpen={majorDropdownOpen}
        onMajorDropdownOpenChange={setMajorDropdownOpen}
        sameYearOnly={sameYearOnly}
        onSameYearOnlyChange={setSameYearOnly}
      />
      <FilterFormFooter
        clearLabel={clearLabel}
        applyLabel={applyLabel}
        loading={loading}
        onClear={handleClear}
        onApply={handleApply}
      />
    </>
  );
};
