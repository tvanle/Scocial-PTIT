/**
 * Copy + option data theo màn – cùng cấu trúc với theme.
 * Thêm màn mới = thêm block ở đây + DATING_COLORS + DATING_LAYOUT.
 */

export interface DatingInterestOption {
  id: string;
  label: string;
  icon: string;
}

const MAJOR_OPTIONS = [
  'Information Technology',
  'Software Engineering',
  'Data Science',
  'Multimedia Technology',
  'Business Administration',
  'Telecommunications',
] as const;

const INTEREST_OPTIONS: DatingInterestOption[] = [
  { id: 'music', label: 'Music', icon: 'music-note' },
  { id: 'gaming', label: 'Gaming', icon: 'sports-esports' },
  { id: 'research', label: 'Research', icon: 'science' },
  { id: 'coding', label: 'Coding', icon: 'code' },
  { id: 'reading', label: 'Reading', icon: 'menu-book' },
  { id: 'movies', label: 'Movies', icon: 'movie' },
  { id: 'gym', label: 'Gym', icon: 'fitness-center' },
  { id: 'art', label: 'Art', icon: 'palette' },
];

export type DatingMajorOption = (typeof MAJOR_OPTIONS)[number];

export const DATING_STRINGS = {
  splash: {
    titleStart: 'PTIT ',
    titleHighlight: 'Connect',
    buttonText: 'Bắt đầu',
    footerText:
      'Dành riêng cho sinh viên Học viện Công nghệ\nBưu chính Viễn thông',
  },
  onboarding: {
    step1Title: 'Find Your Perfect Match',
    step1Description:
      "Find students who share your interests and major. Like a profile to connect—if they like you back, it's a match!",
    next: 'Next',
    step1Of3: 'Step 1 of 3',
    stepLabel: (step: number, total: number) => `Step ${step} of ${total}`,
  },
  profileSetup: {
    title: 'Profile Setup',
    aboutYou: 'About You',
    step2Of3: 'Step 2 of 3',
    photos: 'Photos',
    photosHint: 'Add at least 2 photos to continue',
    mainPhoto: 'Main Photo',
    bio: 'Bio',
    bioPlaceholder:
      "Tell us a bit about yourself, your hobbies, or what you're looking for...",
    bioCounter: (current: number, max: number) => `${current} / ${max}`,
    interests: 'Interests',
    continue: 'Continue',
    photoRequired: 'Thêm ít nhất 2 ảnh để tiếp tục',
    bioRequired: 'Vui lòng nhập bio (ít nhất 10 ký tự)',
    uploading: 'Đang tải ảnh...',
    creating: 'Đang tạo hồ sơ...',
    uploadFailed: 'Tải ảnh thất bại, vui lòng thử lại',
    createFailed: 'Tạo hồ sơ thất bại, vui lòng thử lại',
    permissionRequired: 'Cần quyền truy cập thư viện ảnh',
    defaults: {
      defaultSelectedInterestIds: ['music', 'gaming'] as const,
      progressPercentStep2: 66,
    },
    interestOptions: INTEREST_OPTIONS,
  },
  preferences: {
    step3Of3: 'Step 3 of 3',
    title: 'Dating Preferences',
    findMatch: 'Find your match',
    findMatchHint: "Fine-tune who you'd like to meet on PTIT Connect.",
    ageRange: 'Age Range',
    ageDisplay: (min: number, max: number) =>
      max >= 30 ? `${min} - 30+` : `${min} - ${max}`,
    preferredMajors: 'Preferred Major(s)',
    selectMajor: 'Select major',
    allMajorsSelected: 'All majors selected',
    sameYearOnly: 'Same Year Only',
    sameYearHint:
      'Only show people from your own academic year (e.g., K21).',
    privacyTitle: 'Privacy Note:',
    privacyBody:
      'Your preferences are private and used solely to provide better matches. Other users cannot see your specific filters.',
    finish: 'Finish',
    saving: 'Đang lưu...',
    saveFailed: 'Lưu thất bại, vui lòng thử lại',
    removeMajor: (major: string) => `Remove ${major}`,
    majorOptions: MAJOR_OPTIONS,
  },
  profileDetail: {
    major: 'MAJOR',
    year: 'YEAR',
    aboutMe: 'About Me',
    interests: 'Interests',
    campusStatus: 'Campus Status',
    campusActive: (dept: string) => `Currently active in the ${dept} Department.`,
    unknownName: 'Unknown',
    yearLabel: (y: number) => {
      const suffix = y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th';
      return `${y}${suffix} Year`;
    },
  },
  discovery: {
    emptyTitle: 'Hết người rồi!',
    emptySubtitle: 'Quay lại sau hoặc mở rộng tùy chọn tìm kiếm',
    matchTitle: "It's a Match! 🎉",
    unknownName: 'Unknown',
  },
} as const;
