// Mock Firebase Auth
export const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn((callback) => {
    callback(null);
    return jest.fn();
  }),
};

// Mock Firebase Firestore
export const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    add: jest.fn(),
    where: jest.fn(() => ({
      get: jest.fn(),
      onSnapshot: jest.fn(),
    })),
    orderBy: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  })),
  doc: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => ({ _isFieldValue: true, _methodName: 'serverTimestamp' })),
    increment: jest.fn((n) => ({ _isFieldValue: true, _methodName: 'increment', _operand: n })),
  },
};

// Mock Firebase modules
jest.mock('@react-native-firebase/auth', () => () => mockAuth);
jest.mock('@react-native-firebase/firestore', () => {
  const firestoreMock = () => mockFirestore;
  firestoreMock.FieldValue = mockFirestore.FieldValue;
  return firestoreMock;
});
jest.mock('@react-native-firebase/app', () => ({
  firebase: {
    apps: [],
  },
}));
jest.mock('@react-native-firebase/crashlytics', () => () => ({
  log: jest.fn(),
  recordError: jest.fn(),
}));