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
  locationPermission: {
    headerTitle: 'PTIT Connect',
    title: 'Cho phép truy cập vị trí',
    description:
      'PTIT Connect sử dụng vị trí của bạn để tìm kiếm và kết nối với những người bạn phù hợp ở gần bạn nhất trong khuôn viên học viện.',
    allow: 'Cho phép',
    later: 'Để sau',
  },
  preferences: {
    step3Of3: 'Step 3 of 3',
    title: 'Dating Preferences',
    editTitle: 'Tùy chọn tìm kiếm',
    findMatch: 'Find your match',
    findMatchHint: "Fine-tune who you'd like to meet on PTIT Connect.",
    genderLabel: 'Giới tính muốn xem',
    genderAll: 'Tất cả',
    genderMale: 'Nam',
    genderFemale: 'Nữ',
    genderOther: 'Khác',
    genderHint: 'Chỉ hiển thị người có giới tính đã chọn, sau đó mới tính điểm theo độ tuổi, ngành, năm học.',
    distanceLabel: 'Khoảng cách tối đa',
    distanceHint: 'Dùng cho tính năng gần đây (Nearby). Đơn vị: km.',
    distanceUnlimited: 'Không giới hạn',
    distanceKm: (km: number) => `${km} km`,
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
    save: 'Lưu',
    saving: 'Đang lưu...',
    saveFailed: 'Lưu thất bại, vui lòng thử lại',
    removeMajor: (major: string) => `Remove ${major}`,
    noMajorOption: 'Không chọn',
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
    filterTitle: 'Bộ lọc',
    filterExpandAll: 'Mở rộng tất cả',
    filterClear: 'Gỡ bộ lọc',
    filterApply: 'Dùng bộ lọc',
    filterSectionDistance: 'Khoảng cách',
    filterSectionLookingFor: 'Đang tìm',
    filterSectionAge: 'Độ tuổi',
    filterSectionMajor: 'Ngành học',
    filterSectionSameYear: 'Cùng năm học',
    emptyTitle: 'Hết người rồi!',
    emptySubtitle: 'Quay lại sau hoặc mở rộng tùy chọn tìm kiếm',
    profileMissingTitle: 'Cần hoàn thành hồ sơ',
    profileMissingSubtitle: 'Hoàn thành hồ sơ hẹn hò để bắt đầu khám phá',
    matchTitle: "It's a Match! 🎉",
    unknownName: 'Unknown',
    swipeNopeLabel: 'NOPE',
    swipeLikeLabel: 'LIKE',
    swipeCardHint: 'Swipe left to pass, right to like, or tap to view profile',
    actionSkipLabel: 'Skip profile',
    actionSkipHint: 'Pass on this profile',
    actionLikeLabel: 'Like profile',
    actionLikeHint: 'Like this profile',
    distanceAway: (km: number) => `Cách bạn ${km} km`,
    distanceUnknown: 'Bật vị trí để xem khoảng cách',
    locationUpdating: 'Đang cập nhật vị trí...',
  },
} as const;
