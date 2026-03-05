/**
 * Dating – design tokens từ Figma (position, size, fill, corner radius, stroke).
 * Frame spec: 390×844, fill #FFFFFF, corner radius 0, stroke none, opacity 100%.
 */

// Frame / Screen (từ Figma)
export const datingFrameWidth = 390;
export const datingFrameHeight = 844;
export const datingFrameCornerRadius = 0;
export const datingFrameOpacity = 1;

// Background (fill từ Figma)
export const datingBackground = '#FFFFFF';

// Primary / CTA
export const datingPrimary = '#FF4F5A';
export const datingPrimaryDark = '#FF3B3B';

// Progress
export const datingProgressActive = '#FF4F5A';
export const datingProgressInactive = '#DDDDDD';

// Text
export const datingTextTitle = '#333333';
export const datingTextBody = '#666666';
export const datingTextMuted = '#AAAAAA';
export const datingTextOnPrimary = '#FFFFFF';

// Illustration gradient (dùng cho LinearGradient)
export const datingIconGradientOuter = ['#2B2B4A', '#1A1A3A'] as const;
export const datingIconGradientInner = ['#FF6969', '#FF3B3B'] as const;

// Spacing (khớp Figma: Margin, Container)
export const datingScreenHorizontal = 24;
export const datingProgressBarGap = 6;
export const datingHeroMarginVertical = 24;
export const datingHeroMarginHorizontal = 0;
export const datingIllustrationSize = 160;
export const datingContentTop = 40;
export const datingButtonBottom = 32;

// Border radius
export const datingProgressBarRadius = 2;
export const datingIllustrationRadius = 24;
export const datingButtonRadius = 14;
