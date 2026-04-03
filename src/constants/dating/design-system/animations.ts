/**
 * Dating Design System - Animations
 *
 * Animation presets và configs cho Dating module
 * Sử dụng với react-native-reanimated
 */

import { Easing } from 'react-native-reanimated';

// ═══════════════════════════════════════════════════════════════
// DURATION PRESETS
// ═══════════════════════════════════════════════════════════════

export const DURATION = {
  instant: 100,    // Haptic feedback, micro states
  fast: 150,       // Button presses, toggles
  normal: 250,     // Card transitions, standard
  slow: 400,       // Page transitions
  slower: 500,     // Complex animations
  entrance: 600,   // First load, hero animations
} as const;

// ═══════════════════════════════════════════════════════════════
// EASING PRESETS
// ═══════════════════════════════════════════════════════════════

export const EASING = {
  // Standard easings
  linear: Easing.linear,
  easeIn: Easing.in(Easing.cubic),
  easeOut: Easing.out(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),

  // Playful easings
  easeOutBack: Easing.out(Easing.back(1.5)),
  easeOutBackStrong: Easing.out(Easing.back(2.5)),

  // Elastic
  elastic: Easing.elastic(1),
  elasticSoft: Easing.elastic(0.8),

  // Bounce
  bounce: Easing.bounce,
} as const;

// ═══════════════════════════════════════════════════════════════
// SPRING PRESETS (for withSpring)
// ═══════════════════════════════════════════════════════════════

export const SPRING = {
  // Quick, responsive - buttons, small elements
  snappy: {
    damping: 20,
    stiffness: 400,
    mass: 0.8,
  },

  // Bouncy, playful - cards, fun animations
  bouncy: {
    damping: 12,
    stiffness: 200,
    mass: 0.8,
  },

  // Smooth, elegant - transitions, sheets
  smooth: {
    damping: 25,
    stiffness: 150,
    mass: 1,
  },

  // Gentle, slow - background elements
  gentle: {
    damping: 30,
    stiffness: 100,
    mass: 1.2,
  },

  // Card swipe return
  cardReturn: {
    damping: 15,
    stiffness: 250,
    mass: 0.8,
  },

  // Card exit
  cardExit: {
    damping: 20,
    stiffness: 300,
    mass: 0.6,
  },

  // Stack shuffle (cards moving up)
  stackShuffle: {
    damping: 18,
    stiffness: 200,
    mass: 0.8,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// CARD STACK ANIMATIONS
// ═══════════════════════════════════════════════════════════════

export const CARD_STACK = {
  // Swipe interpolations
  swipe: {
    // X translation affects rotation
    rotation: {
      inputRange: [-200, 0, 200],
      outputRange: ['-12deg', '0deg', '12deg'],
    },

    // Like overlay opacity
    likeOpacity: {
      inputRange: [0, 50, 100],
      outputRange: [0, 0.5, 1],
    },

    // Nope overlay opacity
    nopeOpacity: {
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.5, 0],
    },

    // Card scale while dragging
    dragScale: {
      inputRange: [-200, 0, 200],
      outputRange: [0.95, 1, 0.95],
    },
  },

  // Exit animations
  exit: {
    duration: DURATION.normal,
    translateX: 500, // Off screen
    rotation: 30, // Maximum rotation on exit
  },

  // Stack positions
  stack: {
    // Card behind positions
    positions: [
      { scale: 1, translateY: 0, opacity: 1 },       // Front (active)
      { scale: 0.94, translateY: -8, opacity: 0.75 }, // Second
      { scale: 0.88, translateY: -16, opacity: 0.5 }, // Third
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// BUTTON ANIMATIONS
// ═══════════════════════════════════════════════════════════════

export const BUTTON_ANIM = {
  // Press state
  press: {
    scale: 0.92,
    opacity: 0.9,
    duration: DURATION.instant,
  },

  // Release state
  release: {
    scale: 1,
    opacity: 1,
    spring: SPRING.snappy,
  },

  // Like button activation
  like: {
    iconPulse: {
      scale: [1, 1.3, 1],
      duration: 300,
    },
    glowPulse: {
      opacity: [0, 1, 0],
      scale: [0.8, 1.2, 1],
      duration: 500,
    },
  },

  // Super Like activation
  superLike: {
    iconRotate: {
      rotation: [0, 15, -15, 0],
      duration: 400,
    },
    iconScale: {
      scale: [1, 1.2, 1],
      duration: 300,
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// MICRO-INTERACTIONS
// ═══════════════════════════════════════════════════════════════

export const MICRO = {
  // Image carousel dot
  dot: {
    scale: {
      active: 1.3,
      inactive: 1,
    },
    duration: DURATION.fast,
  },

  // Photo change
  photo: {
    fadeOut: {
      opacity: 0,
      duration: DURATION.instant,
    },
    fadeIn: {
      opacity: 1,
      duration: DURATION.fast,
    },
  },

  // Badge pulse
  badge: {
    scale: [1, 1.1, 1],
    duration: 1000,
    loop: true,
  },

  // Loading shimmer
  shimmer: {
    translateX: [-100, 100],
    duration: 1500,
    loop: true,
  },

  // Typing indicator
  typing: {
    scale: [0.8, 1, 0.8],
    stagger: 150,
    duration: 600,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// MATCH CELEBRATION
// ═══════════════════════════════════════════════════════════════

export const MATCH_CELEBRATION = {
  // Timeline (in ms)
  timeline: {
    overlayFade: 0,
    hapticFirst: 100,
    photosEnter: 200,
    photosCollide: 400,
    hapticSecond: 450,
    heartExplosion: 500,
    textReveal: 600,
    confettiStart: 800,
    buttonsEnter: 1000,
    confettiFade: 2500,
  },

  // Photo animations
  photos: {
    enter: {
      from: { scale: 0.5, rotate: '-10deg', opacity: 0 },
      to: { scale: 1, rotate: '0deg', opacity: 1 },
      duration: 400,
      spring: SPRING.bouncy,
    },
  },

  // Text animation
  text: {
    scale: {
      from: 0.8,
      to: 1,
    },
    opacity: {
      from: 0,
      to: 1,
    },
    duration: 300,
  },

  // Confetti config
  confetti: {
    count: 50,
    duration: 2000,
    colors: ['#FF4458', '#FFB800', '#00D48A', '#8B5CF6', '#FF6B7A'],
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// HAPTIC PATTERNS
// ═══════════════════════════════════════════════════════════════

export const HAPTIC = {
  buttonPress: 'impactLight',
  like: 'impactMedium',
  nope: 'impactMedium',
  superLike: 'notificationSuccess',
  match: 'notificationSuccess',
  swipeThreshold: 'impactHeavy',
  photoChange: 'selectionChanged',
  error: 'notificationError',
  pullRefresh: 'impactLight',
} as const;

// ═══════════════════════════════════════════════════════════════
// TRANSITION PRESETS
// ═══════════════════════════════════════════════════════════════

export const TRANSITIONS = {
  // Screen transitions
  screen: {
    slideRight: {
      entering: { translateX: ['100%', '0%'], duration: DURATION.slow },
      exiting: { translateX: ['0%', '-30%'], duration: DURATION.slow },
    },
    slideUp: {
      entering: { translateY: ['100%', '0%'], duration: DURATION.slow },
      exiting: { translateY: ['0%', '100%'], duration: DURATION.slow },
    },
    fade: {
      entering: { opacity: [0, 1], duration: DURATION.normal },
      exiting: { opacity: [1, 0], duration: DURATION.normal },
    },
  },

  // Bottom sheet
  bottomSheet: {
    entering: {
      translateY: ['100%', '0%'],
      duration: DURATION.slow,
      easing: EASING.easeOut,
    },
    exiting: {
      translateY: ['0%', '100%'],
      duration: DURATION.normal,
      easing: EASING.easeIn,
    },
  },

  // Modal
  modal: {
    entering: {
      scale: [0.9, 1],
      opacity: [0, 1],
      duration: DURATION.normal,
      easing: EASING.easeOutBack,
    },
    exiting: {
      scale: [1, 0.9],
      opacity: [1, 0],
      duration: DURATION.fast,
      easing: EASING.easeIn,
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export const Animations = {
  duration: DURATION,
  easing: EASING,
  spring: SPRING,
  cardStack: CARD_STACK,
  button: BUTTON_ANIM,
  micro: MICRO,
  matchCelebration: MATCH_CELEBRATION,
  haptic: HAPTIC,
  transitions: TRANSITIONS,
};
