// Platform-agnostic entry point for Google Auth Service
import { Platform } from 'react-native';

// Dynamic import based on platform
export const googleAuthService = Platform.select({
  web: require('./googleAuthService.web').googleAuthService,
  default: require('./googleAuthService.native').googleAuthService,
});