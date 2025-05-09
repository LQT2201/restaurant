/**
 * Modern Restaurant App Color Palette
 *
 * Primary: Rich burgundy/wine color - elegant, appetizing, and associated with fine dining
 * Secondary: Warm gold/amber - creates a sense of warmth and luxury
 * Tertiary: Soft sage green - subtle connection to freshness and natural ingredients
 *
 * This palette creates a sophisticated atmosphere while still evoking appetite appeal
 * and maintaining excellent contrast for accessibility.
 */

// Primary Colors - Rich Burgundy/Wine
const primaryColor = "#8E2442"; // Deep burgundy - elegant and appetizing
const primaryLight = "#B5445F"; // Lighter burgundy
const primaryDark = "#6D1331"; // Darker burgundy

// Secondary Colors - Warm Gold/Amber
const secondaryColor = "#E6A919"; // Warm gold - creates warmth and luxury
const secondaryLight = "#F7C250"; // Lighter gold
const secondaryDark = "#C78C00"; // Darker gold

// Tertiary Colors - Soft Sage Green
const tertiaryColor = "#7D9D74"; // Sage green - subtle connection to freshness
const tertiaryLight = "#A1BF99"; // Lighter sage
const tertiaryDark = "#5A7A52"; // Darker sage

// Neutral Colors - Sophisticated Grays
const neutralLightest = "#F8F7F5"; // Almost white with warm undertone
const neutralLight = "#E8E6E1"; // Light warm gray
const neutralMedium = "#9F9C97"; // Medium warm gray
const neutralDark = "#4A4845"; // Dark warm gray
const neutralDarkest = "#252422"; // Almost black with warm undertone

export const Colors = {
  light: {
    // Main Colors
    primary: primaryColor,
    primaryLight: primaryLight,
    primaryDark: primaryDark,

    secondary: secondaryColor,
    secondaryLight: secondaryLight,
    secondaryDark: secondaryDark,

    tertiary: tertiaryColor,
    tertiaryLight: tertiaryLight,
    tertiaryDark: tertiaryDark,

    // Background and Surface
    background: neutralLightest,
    surface: "#FFFFFF",
    surfaceVariant: neutralLight,

    // Text
    text: neutralDarkest,
    textSecondary: neutralDark,
    textTertiary: neutralMedium,
    textOnPrimary: "#FFFFFF",
    textOnSecondary: neutralDarkest,

    // Status Colors
    success: "#2E7D52", // Rich green
    warning: "#E4A951", // Warm amber
    error: "#D64242", // Vibrant red
    info: "#4A6FA5", // Deep blue

    // UI Elements
    icon: neutralDark,
    iconActive: primaryColor,
    tabIconDefault: neutralMedium,
    tabIconSelected: primaryColor,

    // Borders and Dividers
    border: neutralLight,
    divider: "#EBEAE6",

    // Overlays and Shadows
    overlay: "rgba(37, 36, 34, 0.5)",
    shadow: "rgba(0, 0, 0, 0.08)",

    // Special Purpose
    card: "#FFFFFF",
    notification: secondaryColor,
    highlight: "rgba(230, 169, 25, 0.15)", // Subtle gold highlight
    buttonDisabled: neutralLight,
    textDisabled: neutralMedium,
  },

  dark: {
    // Main Colors
    primary: primaryLight,
    primaryLight: "#C9677F", // Even lighter burgundy for dark mode
    primaryDark: primaryColor,

    secondary: secondaryLight,
    secondaryLight: "#FFD57F", // Even lighter gold for dark mode
    secondaryDark: secondaryColor,

    tertiary: tertiaryLight,
    tertiaryLight: "#B5D1AE", // Even lighter sage for dark mode
    tertiaryDark: tertiaryColor,

    // Background and Surface
    background: "#1A1918", // Very dark warm gray
    surface: "#252422", // Dark warm gray
    surfaceVariant: "#333230", // Slightly lighter dark warm gray

    // Text
    text: "#F8F7F5", // Almost white with warm undertone
    textSecondary: "#E8E6E1", // Light warm gray
    textTertiary: "#9F9C97", // Medium warm gray
    textOnPrimary: "#FFFFFF",
    textOnSecondary: neutralDarkest,

    // Status Colors
    success: "#5B9A78", // Lighter green for dark mode
    warning: "#F7C250", // Lighter amber for dark mode
    error: "#E57373", // Lighter red for dark mode
    info: "#7FA1D1", // Lighter blue for dark mode

    // UI Elements
    icon: neutralLight,
    iconActive: primaryLight,
    tabIconDefault: neutralMedium,
    tabIconSelected: primaryLight,

    // Borders and Dividers
    border: "#3E3C39", // Dark warm gray border
    divider: "#333230", // Slightly lighter dark warm gray

    // Overlays and Shadows
    overlay: "rgba(0, 0, 0, 0.7)",
    shadow: "rgba(0, 0, 0, 0.2)",

    // Special Purpose
    card: "#2C2A27", // Slightly lighter than surface
    notification: secondaryLight,
    highlight: "rgba(247, 194, 80, 0.15)", // Subtle gold highlight for dark mode
    buttonDisabled: "#3E3C39", // Dark warm gray
    textDisabled: "#6E6C68", // Medium-dark warm gray
  },
};
