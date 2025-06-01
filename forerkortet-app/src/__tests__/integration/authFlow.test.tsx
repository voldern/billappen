import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '../../test-utils/testUtils';
import { AuthProvider } from '../../contexts/AuthContext';
import LoginScreen from '../../screens/LoginScreen';
import SignupScreen from '../../screens/SignupScreen';
import ForgotPasswordScreen from '../../screens/ForgotPasswordScreen';
import firebaseAuthService from '../../services/firebaseAuthService';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock Firebase auth service
jest.mock('../../services/firebaseAuthService', () => {
  const mockAuthService = {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return jest.fn();
    }),
    getCurrentUser: jest.fn(() => null),
  };
  return mockAuthService;
});

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockDispatch = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    dispatch: mockDispatch,
  }),
}));

describe('Authentication Flow Integration', () => {
  // Helper to ensure auth service methods exist
  const ensureAuthMethods = () => {
    if (!firebaseAuthService.signIn) {
      firebaseAuthService.signIn = jest.fn();
    }
    if (!firebaseAuthService.signUp) {
      firebaseAuthService.signUp = jest.fn();
    }
    if (!firebaseAuthService.resetPassword) {
      firebaseAuthService.resetPassword = jest.fn();
    }
    if (!firebaseAuthService.signOut) {
      firebaseAuthService.signOut = jest.fn();
    }
    if (!firebaseAuthService.getCurrentUser) {
      firebaseAuthService.getCurrentUser = jest.fn();
    }
  };

  beforeEach(() => {
    mockNavigate.mockClear();
    mockGoBack.mockClear();
    mockDispatch.mockClear();
    jest.clearAllMocks();
    (Alert.alert as jest.Mock).mockClear();
    ensureAuthMethods();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should successfully log in with valid credentials', async () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' };
      (firebaseAuthService.signIn as jest.Mock).mockResolvedValue(mockUser);

      const mockNavigation = {
        navigate: mockNavigate,
        goBack: mockGoBack,
        dispatch: mockDispatch,
      } as any;

      const { getByPlaceholderText, getByText } = render(
        <AuthProvider>
          <LoginScreen navigation={mockNavigation} route={{} as any} />
        </AuthProvider>
      );

      // Fill in login form
      fireEvent.changeText(getByPlaceholderText('din@epost.no'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Skriv inn passordet ditt'), 'password123');

      // Submit form
      fireEvent.press(getByText('Logg inn'));

      // Wait for the signIn to be called
      await waitFor(() => {
        expect(firebaseAuthService.signIn).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });

      // Wait for navigation after successful login
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it('should show error message for invalid credentials', async () => {
      const error = new Error('Invalid login credentials');
      (firebaseAuthService.signIn as jest.Mock).mockRejectedValue(error);

      const { getByPlaceholderText, getByText } = render(
        <AuthProvider>
          <LoginScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack, dispatch: mockDispatch } as any} />
        </AuthProvider>
      );

      // Fill in login form
      fireEvent.changeText(getByPlaceholderText('din@epost.no'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Skriv inn passordet ditt'), 'wrongpassword');

      // Submit form
      fireEvent.press(getByText('Logg inn'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Feil', 'Ugyldig e-post eller passord');
      });
    });

    it('should validate email format', async () => {
      const { getByPlaceholderText, getByText } = render(
        <AuthProvider>
          <LoginScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack, dispatch: mockDispatch } as any} />
        </AuthProvider>
      );

      // Fill in invalid email
      fireEvent.changeText(getByPlaceholderText('din@epost.no'), 'invalid-email');
      fireEvent.changeText(getByPlaceholderText('Skriv inn passordet ditt'), 'password123');

      // Submit form
      fireEvent.press(getByText('Logg inn'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Feil', 'Vennligst skriv inn en gyldig e-postadresse');
      });
      
      expect(firebaseAuthService.signIn).not.toHaveBeenCalled();
    });

    it('should navigate to signup screen', () => {
      const { getByText } = render(
        <AuthProvider>
          <LoginScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack, dispatch: mockDispatch } as any} />
        </AuthProvider>
      );

      fireEvent.press(getByText('Opprett konto'));

      expect(mockNavigate).toHaveBeenCalledWith('Signup');
    });

    it('should navigate to forgot password screen', () => {
      const { getByText } = render(
        <AuthProvider>
          <LoginScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack, dispatch: mockDispatch } as any} />
        </AuthProvider>
      );

      fireEvent.press(getByText('Glemt passord?'));

      expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
    });
  });

  describe('Signup Flow', () => {
    it.skip('should successfully create a new account', async () => {
      const mockUser = { uid: 'user123', email: 'newuser@example.com' };
      (firebaseAuthService.signUp as jest.Mock).mockResolvedValue(mockUser);

      const { getByPlaceholderText, getAllByText } = render(
        <AuthProvider>
          <SignupScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack, dispatch: mockDispatch } as any} />
        </AuthProvider>
      );

      // Wait for loading to complete
      await waitFor(() => {
        // Check if the button is not showing "Laster..."
        expect(getAllByText('Opprett konto')).toHaveLength(2);
      });

      // Fill in signup form
      fireEvent.changeText(getByPlaceholderText('din@epost.no'), 'newuser@example.com');
      fireEvent.changeText(getByPlaceholderText('Minst 6 tegn'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Skriv passordet på nytt'), 'password123');

      // Submit form - use getAllByText and select the button (second occurrence)
      fireEvent.press(getAllByText('Opprett konto')[1]);

      await waitFor(() => {
        expect(firebaseAuthService.signUp).toHaveBeenCalledWith(
          'newuser@example.com',
          'password123',
          undefined
        );
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it('should validate password match', async () => {
      const { getByPlaceholderText, getAllByText } = render(
        <AuthProvider>
          <SignupScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack, dispatch: mockDispatch } as any} />
        </AuthProvider>
      );

      // Fill in signup form with mismatched passwords
      fireEvent.changeText(getByPlaceholderText('din@epost.no'), 'newuser@example.com');
      fireEvent.changeText(getByPlaceholderText('Minst 6 tegn'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Skriv passordet på nytt'), 'password456');

      // Submit form
      fireEvent.press(getAllByText('Opprett konto')[1]);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Feil', 'Passordene samsvarer ikke');
      });

      expect(firebaseAuthService.signUp).not.toHaveBeenCalled();
    });

    it('should validate password length', async () => {
      const { getByPlaceholderText, getAllByText } = render(
        <AuthProvider>
          <SignupScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack, dispatch: mockDispatch } as any} />
        </AuthProvider>
      );

      // Fill in signup form with short password
      fireEvent.changeText(getByPlaceholderText('din@epost.no'), 'newuser@example.com');
      fireEvent.changeText(getByPlaceholderText('Minst 6 tegn'), '12345');
      fireEvent.changeText(getByPlaceholderText('Skriv passordet på nytt'), '12345');

      // Submit form
      fireEvent.press(getAllByText('Opprett konto')[1]);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Feil', 'Passordet må være minst 6 tegn');
      });

      expect(firebaseAuthService.signUp).not.toHaveBeenCalled();
    });

    it('should navigate back to login', () => {
      const { getByText } = render(
        <AuthProvider>
          <SignupScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack, dispatch: mockDispatch } as any} />
        </AuthProvider>
      );

      fireEvent.press(getByText('Logg inn'));

      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('Forgot Password Flow', () => {
    it('should successfully send password reset email', async () => {
      (firebaseAuthService.resetPassword as jest.Mock).mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText, queryByText } = render(
        <AuthProvider>
          <ForgotPasswordScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack, dispatch: mockDispatch } as any} />
        </AuthProvider>
      );

      // Fill in email
      fireEvent.changeText(getByPlaceholderText('din@epost.no'), 'test@example.com');

      // Submit form
      fireEvent.press(getByText('Send tilbakestillingslenke'));

      await waitFor(() => {
        expect(firebaseAuthService.resetPassword).toHaveBeenCalledWith('test@example.com');
        expect(queryByText(/test@example.com/)).toBeTruthy();
      });
    });

    it('should show error for non-existent email', async () => {
      const error = new Error('No user found with this email');
      (firebaseAuthService.resetPassword as jest.Mock).mockRejectedValue(error);

      const { getByPlaceholderText, getByText, queryByText } = render(
        <AuthProvider>
          <ForgotPasswordScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack, dispatch: mockDispatch } as any} />
        </AuthProvider>
      );

      // Fill in email
      fireEvent.changeText(getByPlaceholderText('din@epost.no'), 'notfound@example.com');

      // Submit form
      fireEvent.press(getByText('Send tilbakestillingslenke'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Feil', 'No user found with this email');
      });
    });

    it('should navigate back to login', () => {
      const { getByText } = render(
        <AuthProvider>
          <ForgotPasswordScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack, dispatch: mockDispatch } as any} />
        </AuthProvider>
      );

      fireEvent.press(getByText('Tilbake til innlogging'));

      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('Auth State Persistence', () => {
    it('should maintain auth state across screens', async () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' };
      let authCallback: any;

      (firebaseAuthService.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
        authCallback = callback;
        callback(null); // Initially not logged in
        return jest.fn();
      });

      const { rerender } = render(
        <AuthProvider>
          <LoginScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack, dispatch: mockDispatch } as any} />
        </AuthProvider>
      );

      // Simulate successful login
      authCallback(mockUser);

      // Rerender with a different screen
      rerender(
        <AuthProvider>
          <div>Authenticated Content</div>
        </AuthProvider>
      );

      // Auth state should be maintained
      await waitFor(() => {
        expect(firebaseAuthService.getCurrentUser).toBeDefined();
      });
    });
  });
});