// Platform-agnostic entry point for Firebase Auth Service
import { Platform } from 'react-native';

// Dynamic import based on platform
const firebaseAuthService = Platform.select({
  web: require('./firebaseAuthService.web').default,
  default: require('./firebaseAuthService.native').default,
});

export default firebaseAuthService;