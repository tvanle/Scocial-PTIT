/** Animation token + presets cho Reanimated (một nơi duy nhất). */
export const DATING_ANIMATION = {
  durationFast: 250,
  durationNormal: 300,
  durationEntrance: 500,
  stagger: 80,
  translateYEntrance: 24,
  springDamping: 12,
  springStiffness: 90,
  springDampingButton: 15,
  springStiffnessButton: 400,
  modalSheetDamping: 20,
  modalSheetStiffness: 200,
  pressScaleDown: 0.98,
} as const;

/** Spring config cho entrance (fade slide in) */
export const SPRING_ENTRANCE = {
  damping: DATING_ANIMATION.springDamping,
  stiffness: DATING_ANIMATION.springStiffness,
} as const;

/** Spring config cho nút bấm (press scale) */
export const SPRING_BUTTON = {
  damping: DATING_ANIMATION.springDampingButton,
  stiffness: DATING_ANIMATION.springStiffnessButton,
} as const;

/** Spring config cho modal sheet */
export const SPRING_MODAL_SHEET = {
  damping: DATING_ANIMATION.modalSheetDamping,
  stiffness: DATING_ANIMATION.modalSheetStiffness,
} as const;

/** Duration cho fade / overlay */
export const DURATION_FAST = DATING_ANIMATION.durationFast;
export const DURATION_NORMAL = DATING_ANIMATION.durationNormal;
export const DURATION_ENTRANCE = DATING_ANIMATION.durationEntrance;

/** Giá trị scale khi press (nút) */
export const PRESS_SCALE_DOWN = DATING_ANIMATION.pressScaleDown;
