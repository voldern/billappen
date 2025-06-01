// Platform-agnostic auth types

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  isAnonymous: boolean;
  providerId: string;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}