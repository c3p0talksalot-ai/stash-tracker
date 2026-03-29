/**
 * Dark Theme Colors
 * WCAG AA compliant: 4.5:1 for normal text, 3:1 for large text/UI components
 * Color-blind friendly: avoiding red/green as only indicator, using icons + labels
 */
const palette = {
  // Neutrals - high contrast dark theme
  neutral000: "#1A1A1A", // Primary text - nearly white on dark
  neutral100: "#2D2D2D",
  neutral200: "#3D3D3D", // Card background
  neutral300: "#4A4A4A",
  neutral400: "#5C5C5C",
  neutral500: "#707070",
  neutral600: "#8C8C8C",
  neutral700: "#ADADAD",
  neutral800: "#CECECE",
  neutral900: "#F5F5F5", // Main background - near white

  // Primary - warm terracotta (lighter for dark bg visibility)
  primary100: "#8B3A2F",
  primary200: "#A64B3A",
  primary300: "#C45C47",
  primary400: "#D97A65", // Main primary on dark
  primary500: "#E89A85",
  primary600: "#F5C4B0",

  // Secondary - slate blue (lighter for dark bg)
  secondary100: "#2E3A5C",
  secondary200: "#3D4D73",
  secondary300: "#4E6090",
  secondary400: "#6B82AD",
  secondary500: "#8BA3CA",
  secondary600: "#B3C5E0",

  // Accent - golden yellow (lighter for dark bg)
  accent100: "#B8860B",
  accent200: "#DAA520",
  accent300: "#EBC344",
  accent400: "#F5D56E",
  accent500: "#FFE299",
  accent600: "#FFF0C9",

  // Semantic - lighter versions for dark background
  info500: "#60A5FA",
  info100: "#1E3A5F",
  success500: "#34D399",
  success100: "#064E3B",
  warning500: "#FBBF24",
  warning100: "#78350F",
  error500: "#F87171",
  error100: "#7F1D1D",

  // Overlay
  overlay20: "rgba(0, 0, 0, 0.2)",
  overlay50: "rgba(0, 0, 0, 0.5)",
} as const

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",

  // Text - high contrast on dark background
  text: palette.neutral900,
  textDim: palette.neutral600,
  textInverse: palette.neutral000,

  // Backgrounds
  background: palette.neutral000,
  backgroundSecondary: palette.neutral100,
  backgroundCard: palette.neutral200,
  backgroundElevated: palette.neutral100,

  // Borders
  border: palette.neutral300,
  borderFocused: palette.primary400,

  // Interactive
  tint: palette.primary400,
  tintPressed: palette.primary300,
  tintInactive: palette.neutral500,

  // Separators
  separator: palette.neutral300,

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
  card: palette.neutral200,
  primary: palette.primary400,
  primaryBackground: palette.primary100,
} as const
