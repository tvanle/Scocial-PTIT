/** Bảng màu semantic – palette gốc, theme chỉ tham chiếu C.xxx, không hardcode hex */
export const DATING_COLORS_SEMANTIC = {
  primary: '#e83030',
  primaryLight: 'rgba(236, 19, 19, 0.1)',
  primaryOverlay: 'rgba(236, 19, 19, 0.08)',
  primaryBorder: 'rgba(232, 48, 48, 0.1)',
  decorCirclePrimary: 'rgba(236, 19, 19, 0.2)',
  decorCircleSecondary: 'rgba(236, 19, 19, 0.12)',
  glowSplash: 'rgba(250, 78, 87, 0.08)',

  surface: '#ffffff',
  surfaceAlt: '#f8f6f6',
  surfaceMuted: '#f9fafb',
  surfaceTrack: '#f3f4f6',

  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textInverse: '#ffffff',
  textDescription: '#4b5563',

  /** Light theme (splash/onboarding light) */
  lightTextPrimary: '#0f172a',
  lightTextSecondary: '#475569',

  /** Dark theme */
  darkBackground: '#211111',
  darkSurface: '#1e293b',
  darkTextPrimary: '#f1f5f9',
  darkTextMuted: '#64748b',

  border: '#e5e7eb',
  borderMuted: '#f3f4f6',
  borderSlot: '#d1d5db',
  borderTransparent: 'transparent',

  inputBg: '#f9fafb',
  inputPlaceholder: '#9ca3af',

  chipSelectedBg: '#ec1313',
  chipSelectedText: '#ffffff',
  chipUnselectedBg: '#f3f4f6',
  chipUnselectedText: '#374151',
  chipUnselectedBorder: '#e5e7eb',

  progressInactive: '#e6dbdb',
  trackBg: '#f3f4f6',
  trackFill: '#ec1313',
  thumbBg: '#ffffff',
  thumbBorder: '#ec1313',

  toggleTrack: '#e5e7eb',
  toggleThumb: '#ffffff',

  infoBg: 'rgba(59, 130, 246, 0.1)',
  infoBorder: 'rgba(59, 130, 246, 0.2)',
  infoText: 'rgba(30, 64, 175, 0.9)',
  infoIcon: '#3b82f6',

  bottomBarBg: 'rgba(255, 255, 255, 0.9)',
  bottomBarBorder: '#f3f4f6',

  shadow: '#1a1a1a',

  // Discovery screen
  cardOverlayTop: 'rgba(0,0,0,0)',
  cardOverlayMid: 'rgba(0,0,0,0.4)',
  cardOverlayBottom: 'rgba(0,0,0,0.8)',
  cardNameText: '#ffffff',
  cardMajorText: 'rgba(255,255,255,0.9)',
  cardBioText: 'rgba(255,255,255,0.8)',
  tagBg: 'rgba(255,255,255,0.2)',
  tagText: '#ffffff',
  infoBtnBg: 'rgba(0,0,0,0.2)',
  infoBtnBorder: 'rgba(255,255,255,0.2)',
  skipBtnBg: '#ffffff',
  skipIconColor: '#9ca3af',
  boltIconColor: '#eab308',
  primaryShadow: 'rgba(236,19,19,0.4)',
  navActive: '#ec1313',
  navInactive: '#9ca3af',
  emptyTitleColor: '#333333',
  emptySubtitleColor: '#888888',
  matchOverlayBg: 'rgba(196, 30, 58, 0.85)',
  matchText: '#ffffff',
} as const;
