import React from 'react';
import { renderHook, act } from '../../test-utils/testUtils';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('@react-navigation/native');

describe('useAuthGuard', () => {
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock timer functions to avoid clearTimeout is not defined error
    jest.spyOn(global, 'setTimeout');
    jest.spyOn(global, 'clearTimeout');
    
    // Mock useNavigation to return our mock navigate function
    require('@react-navigation/native').useNavigation = jest.fn(() => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
      dispatch: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should return user and loading state', () => {
    const mockUser = { uid: 'user123', email: 'test@example.com' };
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    const { result } = renderHook(() => useAuthGuard());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it('should not navigate when loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    renderHook(() => useAuthGuard());

    // Advance timers to trigger the timeout
    jest.advanceTimersByTime(100);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should navigate to Login when not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    renderHook(() => useAuthGuard());

    // Advance timers to trigger the timeout
    jest.advanceTimersByTime(100);

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('should not navigate when user is authenticated', () => {
    const mockUser = { uid: 'user123', email: 'test@example.com' };
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    renderHook(() => useAuthGuard());

    // Advance timers to trigger the timeout
    jest.advanceTimersByTime(100);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should clear timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    const { unmount } = renderHook(() => useAuthGuard());

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should re-run effect when auth state changes', () => {
    const { rerender } = renderHook(() => useAuthGuard());

    // Initially authenticated
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user123', email: 'test@example.com' },
      loading: false,
    });

    rerender();
    jest.advanceTimersByTime(100);
    expect(mockNavigate).not.toHaveBeenCalled();

    // User logs out
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    rerender();
    jest.advanceTimersByTime(100);
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('should handle transition from loading to unauthenticated', () => {
    // Start with loading state
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    const { rerender } = renderHook(() => useAuthGuard());

    jest.advanceTimersByTime(100);
    expect(mockNavigate).not.toHaveBeenCalled();

    // Loading completes with no user
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    rerender();
    jest.advanceTimersByTime(100);
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('should handle transition from loading to authenticated', () => {
    // Start with loading state
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    const { rerender } = renderHook(() => useAuthGuard());

    jest.advanceTimersByTime(100);
    expect(mockNavigate).not.toHaveBeenCalled();

    // Loading completes with authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user123', email: 'test@example.com' },
      loading: false,
    });

    rerender();
    jest.advanceTimersByTime(100);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should use 100ms delay before navigation', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    renderHook(() => useAuthGuard());

    // Should not navigate immediately
    expect(mockNavigate).not.toHaveBeenCalled();

    // Should not navigate after 50ms
    jest.advanceTimersByTime(50);
    expect(mockNavigate).not.toHaveBeenCalled();

    // Should navigate after 100ms
    jest.advanceTimersByTime(50);
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
});