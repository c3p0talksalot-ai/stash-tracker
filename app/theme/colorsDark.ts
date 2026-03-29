/**
 * Dark Theme Colors
 * WCAG AA compliant: 4.5:1 for normal text, 3:1 for large text/UI components
 * Color-blind friendly: avoiding red/green as only indicator, using icons + labels
 */
const palette = {
  // Neutrals - high contrast dark theme
  neutral000: "#000000",
  neutral100: "#121212", // Main background
  neutral200: "#1E1E1E", // Card background
  neutral300: "#2D2D2D", // Elevated surfaces
  neutral400: "#404040", // Borders
  neutral500: "#525252",
  neutral600: "#6B6B6B",
  neutral700: "#8C8C8C",
  neutral800: "#CECECE", // Secondary text
  neutral900: "#F5F5F5", // Primary text - nearly white

  // Primary - warm terracotta (lighter for dark bg, maintains hue)
  primary100: "#F5C4B0",
  primary200: "#E89A85",
  primary300: "#D97A65",
  primary400: "#C45C47",
  primary500: "#E87D67", // Main primary - lighter for dark bg visibility
  primary600: "#C45C47",

  // Secondary - slate blue (lighter for dark bg)
  secondary100: "#B3C5E0",
  secondary200: "#8BA3CA",
  secondary300: "#6B82AD",
  secondary400: "#8BA3CA",
  secondary500: "#A8BDD9", // Main secondary - lighter for dark bg

  // Accent - golden yellow (lighter for dark bg)
  accent100: "#FFF0C9",
  accent200: "#FFE299",
  accent300: "#F5D56E",
  accent400: "#EBC344",
  accent500: "#FFD54F", // Main accent - lighter for dark bg

  // Semantic - using blue (color-blind friendly vs red)
  info500: "#60A5FA",
  info100: "#1E3A5F",
  success500: "#34D399", // Green - also used with checkmark icon
  success100: "#064E3B",
  warning500: "#FBBF24",
  warning100: "#451A03",
  error500: "#F87171", // Red - lighter for dark bg, also used with X icon
  error100: "#450A0A",

  // Overlay
  overlay20: "rgba(255, 255, 255, 0.08)",
  overlay50: "rgba(255, 255, 255, 0.24)",
} as const

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",

  // Text - high contrast on dark background
  text: palette.neutral900,
  textDim: palette.neutral700,
  textInverse: palette.neutral000,

  // Backgrounds
  background: palette.neutral100,
  backgroundSecondary: palette.neutral200,
  backgroundCard: palette.neutral200,
  backgroundElevated: palette.neutral300,

  // Borders
  border: palette.neutral400,
  borderFocused: palette.primary500,

  // Interactive
  tint: palette.primary500,
  tintPressed: palette.primary400,
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
} as const