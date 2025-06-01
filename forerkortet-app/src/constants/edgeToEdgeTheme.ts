import { Platform, StatusBar } from 'react-native';

/**
 * Edge-to-edge theme constants for Android 15+ compatibility
 */
export const edgeToEdgeTheme = {
  // Default status bar height for different platforms
  statusBarHeight: Platform.select({
    android: StatusBar.currentHeight || 24,
    ios: 44, // Default iOS status bar height
    default: 0,
  }),
  
  // Navigation bar height estimates
  navigationBarHeight: Platform.select({
    android: 48, // Standard Android navigation bar
    ios: 34, // iOS home indicator area
    default: 0,
  }),
  
  // Helper function to create header styles that account for edge-to-edge
  createHeaderStyle: (insetTop: number = 0) => ({
    paddingTop: Platform.select({
      android: Math.max(insetTop, StatusBar.currentHeight || 24),
      ios: insetTop,
      default: insetTop,
    }),
  }),
  
  // Helper function to create footer styles that account for edge-to-edge
  createFooterStyle: (insetBottom: number = 0) => ({
    paddingBottom: Platform.select({
      android: Math.max(insetBottom, 16), // Minimum padding on Android
      ios: insetBottom,
      default: insetBottom,
    }),
  }),
  
  // Navigation options for edge-to-edge screens
  navigationOptions: {
    // Transparent header background for edge-to-edge
    headerTransparent: Platform.OS === 'android',
    headerStyle: Platform.select({
      android: {
        elevation: 0,
        backgroundColor: 'transparent',
      },
      default: undefined,
    }),
  },
};