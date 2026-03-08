/**
 * Layout and copy constants for location permission onboarding.
 * Avoids magic numbers in components.
 */

export const LOCATION_PERMISSION_LAYOUT = {
  header: {
    backButtonSize: 48,
    backIconSize: 24,
    paddingVertical: 16,
    paddingBottom: 8,
  },
  illustration: {
    mainIconSize: 80,
    mainCircleSize: 192,
    floatingIconSize: 24,
    floatingIconPadding: 12,
    floatingIconShadowOffsetY: 4,
    floatingIconShadowOpacity: 0.1,
    floatingIconShadowRadius: 8,
    floatingIconElevation: 4,
    decorCircleScaleOuter: 1.1,
    decorCircleScaleInner: 0.75,
    decorCircleInnerOpacity: 0.8,
  },
  content: {
    titleMarginBottom: 12,
    contentPaddingHorizontal: 8,
  },
  actions: {
    gap: 16,
    paddingBottom: 40,
    maxWidth: 480,
  },
} as const;

export const LOCATION_PERMISSION_ALERTS = {
  permissionDenied: {
    title: 'Quyền vị trí',
    message:
      'Bạn có thể bật quyền vị trí sau trong Cài đặt để xem khoảng cách với mọi người.',
    ok: 'OK',
  },
  error: {
    title: 'Lỗi',
    message:
      'Không lấy được vị trí. Bạn vẫn có thể vào khám phá và bật vị trí sau.',
    ok: 'OK',
  },
} as const;
