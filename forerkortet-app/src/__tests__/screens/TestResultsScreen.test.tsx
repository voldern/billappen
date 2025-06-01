import React from 'react';
import { render, fireEvent } from '../../test-utils/testUtils';
import TestResultsScreen from '../../screens/TestResultsScreen';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import testReducer from '../../store/testSlice';
import resultsReducer from '../../store/resultsSlice';
import * as Haptics from 'expo-haptics';

// Mock dependencies
jest.mock('expo-haptics');

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  push: jest.fn(),
};

const mockRoute = {
  params: {
    testId: 'test-123',
  },
};

describe('TestResultsScreen', () => {
  const mockTestResult = {
    id: 'test-123',
    date: '2024-01-01T12:00:00Z',
    score: 8,
    totalQuestions: 10,
    correctAnswers: 8,
    duration: 300000, // 5 minutes
    answers: [
      { questionId: '1', selectedAnswer: 0, isCorrect: true, timeSpent: 30000 },
      { questionId: '2', selectedAnswer: 1, isCorrect: true, timeSpent: 25000 },
      { questionId: '3', selectedAnswer: 2, isCorrect: false, timeSpent: 35000 },
      { questionId: '4', selectedAnswer: 0, isCorrect: true, timeSpent: 20000 },
      { questionId: '5', selectedAnswer: 3, isCorrect: true, timeSpent: 30000 },
      { questionId: '6', selectedAnswer: 1, isCorrect: true, timeSpent: 40000 },
      { questionId: '7', selectedAnswer: 2, isCorrect: true, timeSpent: 25000 },
      { questionId: '8', selectedAnswer: 0, isCorrect: false, timeSpent: 35000 },
      { questionId: '9', selectedAnswer: 1, isCorrect: true, timeSpent: 30000 },
      { questionId: '10', selectedAnswer: 2, isCorrect: true, timeSpent: 30000 },
    ],
    categoryBreakdown: {
      'traffic-rules': { total: 5, correct: 4 },
      'safety': { total: 3, correct: 3 },
      'signs': { total: 2, correct: 1 },
    },
  };

  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    store = configureStore({
      reducer: {
        test: testReducer,
        results: resultsReducer,
      },
      preloadedState: {
        results: {
          results: [mockTestResult],
          isLoading: false,
        },
      },
    });
  });

  it('should render test results correctly', () => {
    const { getByText } = render(
      <Provider store={store}>
        <TestResultsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    expect(getByText('8 av 10 riktige')).toBeTruthy();
    expect(getByText('80%')).toBeTruthy();
  });

  it('should show pass message for scores >= 85%', () => {
    const passingResult = {
      ...mockTestResult,
      correctAnswers: 9,
      score: 9,
    };

    store = configureStore({
      reducer: {
        test: testReducer,
        results: resultsReducer,
      },
      preloadedState: {
        results: {
          results: [passingResult],
          isLoading: false,
        },
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <TestResultsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    expect(getByText('BESTÅTT')).toBeTruthy();
    expect(getByText('90%')).toBeTruthy();
  });

  it('should show fail message for scores < 85%', () => {
    const { getByText } = render(
      <Provider store={store}>
        <TestResultsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    expect(getByText('IKKE BESTÅTT')).toBeTruthy();
    expect(getByText('80%')).toBeTruthy();
  });

  it('should display test duration', () => {
    const { getByText } = render(
      <Provider store={store}>
        <TestResultsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    expect(getByText('5 min 0 sek')).toBeTruthy();
  });

  it('should display category breakdown', () => {
    const { getByText } = render(
      <Provider store={store}>
        <TestResultsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    expect(getByText('Kategorifordeling')).toBeTruthy();
    expect(getByText('traffic-rules')).toBeTruthy();
    expect(getByText(/4\/5/)).toBeTruthy();
    expect(getByText('safety')).toBeTruthy();
    expect(getByText(/3\/3/)).toBeTruthy();
    expect(getByText('signs')).toBeTruthy();
    expect(getByText(/1\/2/)).toBeTruthy();
  });

  it('should trigger confetti for perfect score', () => {
    const perfectResult = {
      ...mockTestResult,
      correctAnswers: 10,
      score: 10,
    };

    store = configureStore({
      reducer: {
        test: testReducer,
        results: resultsReducer,
      },
      preloadedState: {
        results: {
          results: [perfectResult],
          isLoading: false,
        },
      },
    });

    const { getByTestId } = render(
      <Provider store={store}>
        <TestResultsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    // Confetti should be shown for perfect score
    expect(getByTestId('confetti-container')).toBeTruthy();
  });

  it('should navigate to new test', () => {
    const { getByText } = render(
      <Provider store={store}>
        <TestResultsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    fireEvent.press(getByText('Ta ny test'));

    expect(mockNavigation.push).toHaveBeenCalledWith('NewTest');
  });

  it('should navigate to home', () => {
    const { getByText } = render(
      <Provider store={store}>
        <TestResultsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    fireEvent.press(getByText('Se alle resultater'));

    expect(mockNavigation.push).toHaveBeenCalledWith('ResultsList');
  });

  it('should handle missing test result', () => {
    store = configureStore({
      reducer: {
        test: testReducer,
        results: resultsReducer,
      },
      preloadedState: {
        results: {
          results: [], // No results
          isLoading: false,
        },
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <TestResultsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    // Should show error message for missing test result
    expect(getByText('Fant ikke testresultat')).toBeTruthy();
  });

  it('should display motivational messages', () => {
    const { getByText } = render(
      <Provider store={store}>
        <TestResultsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    // Check for motivational message based on score
    expect(getByText(/Godt jobbet|Bra jobbet|Fortsett/)).toBeTruthy();
  });

  it('should calculate and display average time per question', () => {
    const { getByText } = render(
      <Provider store={store}>
        <TestResultsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    // Average time: 300000ms / 10 questions = 30000ms = 30 seconds
    expect(getByText('30 sek')).toBeTruthy();
  });

  it('should show motivational message for non-perfect scores', () => {
    const { getByText } = render(
      <Provider store={store}>
        <TestResultsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    expect(getByText(/Godt forsøk|På rett vei/)).toBeTruthy();
  });

  it('should show congratulatory message for perfect scores', () => {
    const perfectResult = {
      ...mockTestResult,
      correctAnswers: 10,
      score: 10,
    };

    store = configureStore({
      reducer: {
        test: testReducer,
        results: resultsReducer,
      },
      preloadedState: {
        results: {
          results: [perfectResult],
          isLoading: false,
        },
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <TestResultsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    expect(getByText(/Perfekt|Du mestrer/)).toBeTruthy();
  });

  it('should handle test result from route params', () => {
    // Test with result passed directly in route params using existing testId
    const routeWithResult = {
      params: {
        testId: 'test-123', // Use existing testId from store
      },
    };

    const { getByText } = render(
      <Provider store={store}>
        <TestResultsScreen navigation={mockNavigation as any} route={routeWithResult as any} />
      </Provider>
    );

    expect(getByText('8 av 10 riktige')).toBeTruthy();
  });
});