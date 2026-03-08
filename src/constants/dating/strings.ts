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
  'Công nghệ thông tin',
  'Công nghệ Đa Phương Tiện',
  'Khoa học Dữ liệu',
  'Công nghệ Đa phương tiện',
  'Quản lý Kinh doanh',
  'Viễn thông',
] as const;

const INTEREST_OPTIONS: DatingInterestOption[] = [
  { id: 'music', label: 'Âm nhạc', icon: 'music-note' },
  { id: 'gaming', label: 'Chơi game', icon: 'sports-esports' },
  { id: 'research', label: 'Nghiên cứu', icon: 'science' },
  { id: 'coding', label: 'Lập trình', icon: 'code' },
  { id: 'reading', label: 'Đọc sách', icon: 'menu-book' },
  { id: 'movies', label: 'Phim', icon: 'movie' },
  { id: 'gym', label: 'Tập gym', icon: 'fitness-center' },
  { id: 'art', label: 'Nghệ thuật', icon: 'palette' },
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
    step1Title: 'Tìm Đối Tác Hoàn Hảo',
    step1Description:
      'Tìm những sinh viên cùng chia sẻ sở thích và ngành học của bạn. Thích trên một hồ sơ để kết nối—nếu họ cũng thích bạn, đó là một kết nối!',
    next: 'Tiếp theo',
    step1Of3: 'Bước 1 của 3',
    stepLabel: (step: number, total: number) => `Bước ${step} của ${total}`,
  },
  profileSetup: {
    title: 'Thiết Lập Hồ Sơ',
    aboutYou: 'Về Bạn',
    step2Of3: 'Bước 2 của 3',
    photos: 'Ảnh',
    photosHint: 'Thêm ít nhất 2 ảnh để tiếp tục',
    mainPhoto: 'Ảnh Chính',
    bio: 'Tiểu sử',
    bioPlaceholder:
      'Hãy cho chúng tôi biết một chút về bạn, những sở thích của bạn, hoặc bạn đang tìm kiếm điều gì...',
    bioCounter: (current: number, max: number) => `${current} / ${max}`,
    interests: 'Sở thích',
    continue: 'Tiếp tục',
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
      'PTIT Connect sử dụng vị trí của bạn để tìm kiếm và kết nối với những người bạn phù hợp ở gần bạn nhất trong khuôn viên học viện. Bật vị trí là bắt buộc để sử dụng tính năng.',
    allow: 'Cho phép',
  },
  preferences: {
    step3Of3: 'Bước 3 của 3',
    title: 'Tùy Chọn Hẹn Hò',
    editTitle: 'Tùy chọn tìm kiếm',
    findMatch: 'Tìm đối tác của bạn',
    findMatchHint: 'Tinh chỉnh người mà bạn muốn gặp trên PTIT Connect.',
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
    ageRange: 'Khoảng Độ Tuổi',
    ageDisplay: (min: number, max: number) =>
      max >= 30 ? `${min} - 30+` : `${min} - ${max}`,
    preferredMajors: 'Ngành Học Ưa Thích',
    selectMajor: 'Chọn ngành',
    allMajorsSelected: 'Đã chọn tất cả ngành',
    sameYearOnly: 'Cùng Năm Học',
    sameYearHint:
      'Chỉ hiển thị những người từ cùng năm học của bạn (ví dụ: K21).',
    privacyTitle: 'Lưu ý về Quyền Riêng Tư:',
    privacyBody:
      'Tùy chọn của bạn là riêng tư và chỉ được sử dụng để cung cấp các kết nối tốt hơn. Người dùng khác không thể thấy các bộ lọc cụ thể của bạn.',
    finish: 'Hoàn thành',
    save: 'Lưu',
    saving: 'Đang lưu...',
    saveFailed: 'Lưu thất bại, vui lòng thử lại',
    removeMajor: (major: string) => `Xóa ${major}`,
    noMajorOption: 'Không chọn',
    majorOptions: MAJOR_OPTIONS,
  },
  profileDetail: {
    major: 'NGÀNH HỌC',
    year: 'NĂM HỌC',
    aboutMe: 'Về Tôi',
    interests: 'Sở Thích',
    campusStatus: 'Trạng Thái Toàn Trường',
    campusActive: (dept: string) => `Hiện đang hoạt động trong Phòng ${dept}.`,
    unknownName: 'Không rõ',
    yearLabel: (y: number) => {
      return `Năm ${y}`;
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
    emptyStateTitle: 'Bạn đã khám phá tất cả hồ sơ hôm nay!',
    emptyStateSubtitle:
      'Quay lại sau hoặc mở rộng bộ lọc tìm kiếm của bạn để tìm thêm kết nối trong cộng đồng.',
    emptyStateRefinePreferences: 'Tinh Chỉnh Tùy Chọn',
    profileMissingTitle: 'Cần hoàn thành hồ sơ',
    profileMissingSubtitle: 'Hoàn thành hồ sơ hẹn hò để bắt đầu khám phá',
    matchTitle: 'Đã Kết Nối! 🎉',
    unknownName: 'Không rõ',
    swipeNopeLabel: 'PASS',
    swipeLikeLabel: 'THÍCH',
    swipeCardHint: 'Vuốt sang trái để bỏ qua, vuốt sang phải để thích, hoặc nhấn để xem hồ sơ',
    actionSkipLabel: 'Bỏ qua hồ sơ',
    actionSkipHint: 'Bỏ qua hồ sơ này',
    actionLikeLabel: 'Thích hồ sơ',
    actionLikeHint: 'Thích hồ sơ này',
    distanceAway: (km: number) => `Cách bạn ${km} km`,
    distanceUnknown: 'Bật vị trí để xem khoảng cách',
    locationUpdating: 'Đang cập nhật vị trí...',
  },
} as const;
