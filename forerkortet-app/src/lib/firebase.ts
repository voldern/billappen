// Platform-agnostic entry point for Firebase
import { Platform } from 'react-native';

// Dynamic import based on platform
const firebase = Platform.select({
  web: require('./firebase.web'),
  default: require('./firebase.native'),
});

export const auth = firebase.auth;
export const db = firebase.db;
export const crashlytics = firebase.crashlytics;
export const analytics = firebase.analytics;