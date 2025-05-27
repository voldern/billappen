import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import crashlytics from '@react-native-firebase/crashlytics';

// React Native Firebase is configured automatically via native configuration files
// (google-services.json for Android and GoogleService-Info.plist for iOS)
// No initialization code is needed

export { auth, firestore as db, crashlytics };

// Enable Crashlytics in production
if (!__DEV__) {
  crashlytics().setCrashlyticsCollectionEnabled(true);
}
