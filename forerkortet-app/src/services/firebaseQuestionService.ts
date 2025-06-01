// This file serves as the entry point for firebaseQuestionService
// Platform-specific implementations will be loaded based on the platform

import { Platform } from 'react-native';

// Dynamic import based on platform
const firebaseQuestionService = Platform.select({
  web: require('./firebaseQuestionService.web').default,
  default: require('./firebaseQuestionService.native').default,
});

export default firebaseQuestionService;