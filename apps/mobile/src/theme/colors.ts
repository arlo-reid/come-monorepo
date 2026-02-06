/**
 * COME Brand Colors
 * Based on brand guidelines
 */
export const colors = {
  // Primary
  midnight: '#0A0A0A',
  charcoal: '#171717',
  ember: '#F97316',
  warmWhite: '#FAFAFA',
  
  // Neutrals
  smoke: '#262626',
  ash: '#A3A3A3',
  stone: '#737373',
  muted: '#525252',
  
  // Semantic
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Transparent
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
