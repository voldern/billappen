import React from 'react';
import { render, waitFor, fireEvent } from '../../test-utils/testUtils';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import firebaseAuthService from '../../services/firebaseAuthService';
import { Text, Button } from 'react-native';

// Mock Firebase auth service
jest.mock('../../services/firebaseAuthService');

// Test component to access auth context
const TestComponent = () => {
  const { user, loading, signIn, signUp, signOut, resetPassword } = useAuth();
  
  return (
    <>
      <Text testID="loading">{loading ? 'Loading' : 'Not Loading'}</Text>
      <Text testID="user">{user ? user.email : 'No User'}</Text>
      <Button testID="signIn" title="Sign In" onPress={() => signIn('test@example.com', 'password')} />
      <Button testID="signUp" title="Sign Up" onPress={() => signUp('new@example.com', 'password', 'Test User')} />
      <Button testID="signOut" title="Sign Out" onPress={signOut} />
      <Button testID="resetPassword" title="Reset" onPress={() => resetPassword('test@example.com')} />
    </>
  );
};

describe('AuthContext', () => {
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();
    
    // Mock default auth state
    (firebaseAuthService.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      // Simulate async auth state check
      setTimeout(() => callback(null), 0);
      return mockUnsubscribe;
    });
  });

  describe('AuthProvider', () => {
    it('should provide auth context to children', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially loading
      expect(getByTestId('loading').props.children).toBe('Loading');

      // After auth state is resolved
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('Not Loading');
        expect(getByTestId('user').props.children).toBe('No User');
      });
    });

    it('should handle authenticated user', async () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' };
      
      (firebaseAuthService.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0);
        return mockUnsubscribe;
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('user').props.children).toBe('test@example.com');
      });
    });

    it('should unsubscribe on unmount', () => {
      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });
  });

  describe('Auth methods', () => {
    const setupTest = () => {
      return render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    };

    it('should handle successful sign in', async () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' };
      (firebaseAuthService.signIn as jest.Mock).mockResolvedValue(mockUser);

      const { getByTestId } = setupTest();

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('Not Loading');
      });

      fireEvent.press(getByTestId('signIn'));

      await waitFor(() => {
        expect(firebaseAuthService.signIn).toHaveBeenCalledWith(
          'test@example.com',
          'password'
        );
      });
    });

    it('should handle sign in error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Invalid credentials');
      (firebaseAuthService.signIn as jest.Mock).mockRejectedValue(error);

      const { getByTestId } = setupTest();

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('Not Loading');
      });

      fireEvent.press(getByTestId('signIn'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Sign in error:', error);
      });

      consoleError.mockRestore();
    });

    it('should handle successful sign up', async () => {
      const mockUser = { uid: 'user123', email: 'new@example.com' };
      (firebaseAuthService.signUp as jest.Mock).mockResolvedValue(mockUser);

      const { getByTestId } = setupTest();

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('Not Loading');
      });

      fireEvent.press(getByTestId('signUp'));

      await waitFor(() => {
        expect(firebaseAuthService.signUp).toHaveBeenCalledWith(
          'new@example.com',
          'password',
          'Test User'
        );
      });
    });

    it('should handle sign up error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Email already in use');
      (firebaseAuthService.signUp as jest.Mock).mockRejectedValue(error);

      const { getByTestId } = setupTest();

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('Not Loading');
      });

      fireEvent.press(getByTestId('signUp'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Sign up error:', error);
      });

      consoleError.mockRestore();
    });

    it('should handle successful sign out', async () => {
      (firebaseAuthService.signOut as jest.Mock).mockResolvedValue(undefined);

      const { getByTestId } = setupTest();

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('Not Loading');
      });

      fireEvent.press(getByTestId('signOut'));

      await waitFor(() => {
        expect(firebaseAuthService.signOut).toHaveBeenCalled();
      });
    });

    it('should handle sign out error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Sign out failed');
      (firebaseAuthService.signOut as jest.Mock).mockRejectedValue(error);

      const { getByTestId } = setupTest();

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('Not Loading');
      });

      fireEvent.press(getByTestId('signOut'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Sign out error:', error);
      });

      consoleError.mockRestore();
    });

    it('should handle successful password reset', async () => {
      (firebaseAuthService.resetPassword as jest.Mock).mockResolvedValue(undefined);

      const { getByTestId } = setupTest();

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('Not Loading');
      });

      fireEvent.press(getByTestId('resetPassword'));

      await waitFor(() => {
        expect(firebaseAuthService.resetPassword).toHaveBeenCalledWith(
          'test@example.com'
        );
      });
    });

    it('should handle password reset error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('User not found');
      (firebaseAuthService.resetPassword as jest.Mock).mockRejectedValue(error);

      const { getByTestId } = setupTest();

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('Not Loading');
      });

      fireEvent.press(getByTestId('resetPassword'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Reset password error:', error);
      });

      consoleError.mockRestore();
    });
  });

  describe('Auth state changes', () => {
    it('should update user state when auth state changes', async () => {
      let authCallback: any;
      
      (firebaseAuthService.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
        authCallback = callback;
        callback(null); // Start with no user
        return mockUnsubscribe;
      });

      const { getByTestId, rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially no user
      await waitFor(() => {
        expect(getByTestId('user').props.children).toBe('No User');
      });

      // Simulate user login
      const mockUser = { uid: 'user123', email: 'test@example.com' };
      authCallback(mockUser);

      await waitFor(() => {
        expect(getByTestId('user').props.children).toBe('test@example.com');
      });

      // Simulate user logout
      authCallback(null);

      await waitFor(() => {
        expect(getByTestId('user').props.children).toBe('No User');
      });
    });
  });
});