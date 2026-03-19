export interface DatingInterestOption {
  id: string;
  label: string;
  icon: string;
}

export const DATING_INTEREST_OPTIONS: DatingInterestOption[] = [
  { id: 'music', label: 'Music', icon: 'music-note' },
  { id: 'gaming', label: 'Gaming', icon: 'sports-esports' },
  { id: 'research', label: 'Research', icon: 'science' },
  { id: 'coding', label: 'Coding', icon: 'code' },
  { id: 'reading', label: 'Reading', icon: 'menu-book' },
  { id: 'movies', label: 'Movies', icon: 'movie' },
  { id: 'gym', label: 'Gym', icon: 'fitness-center' },
  { id: 'art', label: 'Art', icon: 'palette' },
];

export const DATING_PROFILE_SETUP_DEFAULTS = {
  defaultSelectedInterestIds: ['music', 'gaming'] as const,
  progressPercentStep2: 66,
} as const;
