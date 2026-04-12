// Animation utility functions and constants

export const ANIMATION_DURATIONS = {
  fast: 200,
  normal: 300,
  slow: 500,
  slower: 700,
} as const;

export const EASING = {
  easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export const STAGGER_DELAYS = {
  1: '0.1s',
  2: '0.2s',
  3: '0.3s',
  4: '0.4s',
  5: '0.5s',
  6: '0.6s',
  7: '0.7s',
  8: '0.8s',
} as const;

// Animation class generators
export const getStaggerDelay = (index: number): string => {
  const delay = Math.min(index + 1, 8) as keyof typeof STAGGER_DELAYS;
  return STAGGER_DELAYS[delay];
};

export const getAnimationClass = (
  type: 'fade-in' | 'slide-up' | 'slide-in-left' | 'slide-in-right' | 'scale-in',
  delay?: number
): string => {
  const baseClass = `animate-${type}`;
  if (delay !== undefined) {
    const staggerClass = `animate-stagger-${Math.min(delay, 8)}`;
    return `${baseClass} ${staggerClass}`;
  }
  return baseClass;
};

// Hover animation classes
export const HOVER_ANIMATIONS = {
  lift: 'hover-lift',
  glow: 'hover-glow',
  scale: 'hover-scale',
  rotate: 'hover-rotate',
} as const;

// Loading animation classes
export const LOADING_ANIMATIONS = {
  shimmer: 'animate-shimmer',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce-gentle',
} as const;