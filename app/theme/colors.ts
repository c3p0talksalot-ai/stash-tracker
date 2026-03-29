/**
 * Light Theme Colors
 * WCAG AA compliant: 4.5:1 for normal text, 3:1 for large text/UI components
 * Color-blind friendly: avoiding red/green as only indicator, using icons + labels
 */
const palette = {
  // Neutrals - high contrast light theme
  neutral900: "#1A1A1A", // Primary text - nearly black
  neutral800: "#2D2D2D",
  neutral700: "#4A4A4A",
  neutral600: "#6B6B6B",
  neutral500: "#8C8C8C",
  neutral400: "#ADADAD",
  neutral300: "#CECECE",
  neutral200: "#E8E8E8", // Secondary background
  neutral100: "#F5F5F5", // Card background
  neutral000: "#FFFFFF", // Main background

  // Primary - warm terracotta (distinctive, not red/green)
  primary600: "#8B3A2F",
  primary500: "#A64B3A", // Main primary
  primary400: "#C45C47",
  primary300: "#D97A65",
  primary200: "#E89A85",
  primary100: "#F5C4B0",

  // Secondary - slate blue (distinct from primary, good contrast)
  secondary600: "#2E3A5C",
  secondary500: "#3D4D73",
  secondary400: "#4E6090",
  secondary300: "#6B82AD",
  secondary200: "#8BA3CA",
  secondary100: "#B3C5E0",

  // Accent - golden yellow (attention, distinct from primary/secondary)
  accent600: "#B8860B",
  accent500: "#DAA520", // Main accent
  accent400: "#EBC344",
  accent300: "#F5D56E",
  accent200: "#FFE299",
  accent100: "#FFF0C9",

  // Semantic - using blue (color-blind friendly vs red)
  info500: "#2563EB",
  info100: "#DBEAFE",
  success500: "#059669", // Green - also used with checkmark icon
  success100: "#D1FAE5",
  warning500: "#D97706",
  warning100: "#FEF3C7",
  error500: "#DC2626", // Red - also used with X icon
  error100: "#FEE2E2",

  // Overlay
  overlay20: "rgba(0, 0, 0, 0.08)",
  overlay50: "rgba(0, 0, 0, 0.24)",
} as const

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",

  // Text - high contrast on light background
  text: palette.neutral900,
  textDim: palette.neutral600,
  textInverse: palette.neutral000,

  // Backgrounds
  background: palette.neutral000,
  backgroundSecondary: palette.neutral100,
  backgroundCard: palette.neutral100,
  backgroundElevated: palette.neutral000,

  // Borders
  border: palette.neutral300,
  borderFocused: palette.primary500,

  // Interactive
  tint: palette.primary500,
  tintPressed: palette.primary600,
  tintInactive: palette.neutral400,

  // Separators
  separator: palette.neutral200,

  // Semantic (with icons for accessibility)
  error: palette.error500,
  errorBackground: palette.error100,
  success: palette.success500,
  successBackground: palette.success100,
  warning: palette.warning500,
  warningBackground: palette.warning100,
  info: palette.info500,
  infoBackground: palette.info100,

  // Aliases for components expecting these names
  card: palette.neutral100,
  primary: palette.primary500,
} as const
