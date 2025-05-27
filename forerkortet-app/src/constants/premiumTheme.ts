// Premium theme inspired by award-winning apps like Focus Traveler and Headspace
export const premiumTheme = {
  colors: {
    // Primary palette - sophisticated blue with depth
    primary: {
      50: "#E8F1FF",
      100: "#D4E5FF",
      200: "#A8CAFF",
      300: "#7DADFF",
      400: "#5590FF",
      500: "#3B7BF6", // Main brand color
      600: "#2563EB",
      700: "#1D4ED8",
      800: "#1E40AF",
      900: "#1E3A8A",
    },
    
    // Accent colors - warm coral for energy and success
    accent: {
      light: "#FFE4E1",
      main: "#FF6B6B",
      dark: "#FF4757",
      muted: "#FFA8A8",
    },
    
    // Success, error, warning with softer tones
    semantic: {
      success: {
        light: "#D3F9D8",
        main: "#51CF66",
        dark: "#37B24D",
        text: "#2B8838",
      },
      error: {
        light: "#FFE3E3",
        main: "#FF6B6B",
        dark: "#FA5252",
        text: "#C92A2A",
      },
      warning: {
        light: "#FFF3BF",
        main: "#FFD43B",
        dark: "#FCC419",
        text: "#E67700",
      },
      info: {
        light: "#D0EBFF",
        main: "#339AF0",
        dark: "#1C7ED6",
        text: "#1864AB",
      },
    },
    
    // Sophisticated neutrals
    neutral: {
      0: "#FFFFFF",
      50: "#FAFBFC",
      100: "#F4F6F8",
      200: "#E9ECEF",
      300: "#DEE2E6",
      400: "#CED4DA",
      500: "#ADB5BD",
      600: "#868E96",
      700: "#495057",
      800: "#343A40",
      900: "#212529",
      1000: "#16191D",
    },
    
    // Background colors with subtle gradients
    background: {
      primary: "#FFFFFF",
      secondary: "#FAFBFC",
      tertiary: "#F4F6F8",
      elevated: "#FFFFFF",
      overlay: "rgba(0, 0, 0, 0.5)",
      gradient: {
        start: "#F8F9FF",
        end: "#FFFFFF",
      },
    },
    
    // Text colors with better hierarchy
    text: {
      primary: "#1A1D21",
      secondary: "#495057",
      tertiary: "#868E96",
      inverse: "#FFFFFF",
      muted: "#ADB5BD",
      link: "#3B7BF6",
    },
  },
  
  typography: {
    // Using system fonts with fallbacks for consistency
    fontFamily: {
      regular: "System",
      medium: "System",
      semibold: "System",
      bold: "System",
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      md: 18,
      lg: 20,
      xl: 24,
      "2xl": 30,
      "3xl": 36,
      "4xl": 48,
    },
    
    fontWeight: {
      regular: "400" as "400",
      medium: "500" as "500",
      semibold: "600" as "600",
      bold: "700" as "700",
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
    
    letterSpacing: {
      tight: -0.02,
      normal: 0,
      wide: 0.02,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
    "3xl": 64,
    "4xl": 96,
  },
  
  borderRadius: {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    "2xl": 32,
    full: 9999,
  },
  
  shadows: {
    none: {},
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 12,
    },
    inner: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: -2,
    },
  },
  
  animation: {
    duration: {
      instant: 100,
      fast: 200,
      normal: 300,
      slow: 500,
      slower: 800,
    },
    
    easing: {
      // Cubic bezier curves for smooth animations
      easeIn: [0.4, 0, 1, 1],
      easeOut: [0, 0, 0.2, 1],
      easeInOut: [0.4, 0, 0.2, 1],
      spring: { damping: 15, stiffness: 100 },
    },
  },
  
  layout: {
    maxWidth: 600,
    contentPadding: 24,
    cardPadding: 20,
    screenPadding: 16,
  },
};