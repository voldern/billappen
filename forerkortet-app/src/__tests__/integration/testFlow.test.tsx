import React from 'react';
import { render, fireEvent, waitFor } from '../../test-utils/testUtils';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import testReducer from '../../store/testSlice';
import resultsReducer from '../../store/resultsSlice';
import QuestionScreen from '../../screens/QuestionScreen';
import TestResultsScreen from '../../screens/TestResultsScreen';
import { AuthProvider } from '../../contexts/AuthContext';
import { Question } from '../../types';

// Mock Firebase auth service
jest.mock('../../services/firebaseAuthService', () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
  onAuthStateChanged: jest.fn((callback) => {
    callback(null);
    return jest.fn();
  }),
  getCurrentUser: jest.fn(() => null),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockReset = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
  }),
}));

// Mock Firebase service
jest.mock('../../services/firebaseQuestionService', () => ({
  default: {
    saveTestResult: jest.fn().mockResolvedValue('test-id-123'),
  },
}));

describe('Test Flow Integration', () => {
  const mockQuestions: Question[] = [
    {
      id: '1',
      question: 'What is the speed limit in residential areas?',
      options: ['30 km/h', '40 km/h', '50 km/h', '60 km/h'],
      correctAnswer: 0,
      explanation: 'In residential areas, the speed limit is typically 30 km/h.',
      category: 'traffic-rules',
    },
    {
      id: '2',
      question: 'When should you use hazard lights?',
      options: ['During rain', 'When parked illegally', 'In emergency situations', 'At night'],
      correctAnswer: 2,
      explanation: 'Hazard lights should be used in emergency situations.',
      category: 'safety',
    },
    {
      id: '3',
      question: 'What does a yellow traffic light mean?',
      options: ['Speed up', 'Stop if safe', 'Continue normally', 'Turn right'],
      correctAnswer: 1,
      explanation: 'A yellow light means stop if it is safe to do so.',
      category: 'traffic-signals',
    },
  ];

  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        test: testReducer,
        results: resultsReducer,
      },
      preloadedState: {
        test: {
          questions: mockQuestions,
          currentQuestionIndex: 0,
          answers: [],
          startTime: Date.now(),
          endTime: null,
        },
      },
    });

    jest.clearAllMocks();
  });

  describe('Complete Test Flow', () => {
    it.skip('should complete a full test flow from questions to results', async () => {
      // Start with QuestionScreen
      const { getByText, rerender } = render(
        <AuthProvider>
          <Provider store={store}>
            <QuestionScreen />
          </Provider>
        </AuthProvider>
      );

      // Verify first question is displayed
      expect(getByText('What is the speed limit in residential areas?')).toBeTruthy();
      expect(getByText('Spørsmål 1 av 3')).toBeTruthy();

      // Answer first question correctly
      fireEvent.press(getByText('30 km/h'));
      await waitFor(() => {
        expect(getByText('Bekreft svar')).toBeTruthy();
      });
      fireEvent.press(getByText('Bekreft svar'));

      // Verify second question
      await waitFor(() => {
        expect(getByText('When should you use hazard lights?')).toBeTruthy();
        expect(getByText('Spørsmål 2 av 3')).toBeTruthy();
      });

      // Answer second question incorrectly
      fireEvent.press(getByText('During rain'));
      await waitFor(() => {
        expect(getByText('Bekreft svar')).toBeTruthy();
      });
      fireEvent.press(getByText('Bekreft svar'));

      // Verify third question
      await waitFor(() => {
        expect(getByText('What does a yellow traffic light mean?')).toBeTruthy();
        expect(getByText('Spørsmål 3 av 3')).toBeTruthy();
      });

      // Answer third question correctly
      fireEvent.press(getByText('Stop if safe'));
      await waitFor(() => {
        expect(getByText('Fullfør')).toBeTruthy();
      });
      fireEvent.press(getByText('Fullfør'));

      // Should navigate to results
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('TestResults');
      });

      // Render TestResultsScreen
      rerender(
        <Provider store={store}>
          <TestResultsScreen />
        </Provider>
      );

      // Verify results are displayed
      await waitFor(() => {
        expect(getByText('Testresultater')).toBeTruthy();
        expect(getByText('2 av 3 riktige')).toBeTruthy();
        expect(getByText('67%')).toBeTruthy();
      });
    });

    it.skip('should handle navigation between questions', async () => {
      const { getByText, queryByText } = render(
        <AuthProvider>
          <Provider store={store}>
            <QuestionScreen />
          </Provider>
        </AuthProvider>
      );

      // Start at first question
      expect(getByText('What is the speed limit in residential areas?')).toBeTruthy();

      // Answer and go to next
      fireEvent.press(getByText('30 km/h'));
      fireEvent.press(getByText('Bekreft svar'));

      // Should be at second question
      await waitFor(() => {
        expect(getByText('When should you use hazard lights?')).toBeTruthy();
      });

      // Go back to previous
      fireEvent.press(getByText('Forrige'));

      // Should be back at first question
      await waitFor(() => {
        expect(getByText('What is the speed limit in residential areas?')).toBeTruthy();
      });

      // Previous answer should still be selected
      // Note: This depends on the implementation storing answers
    });

    it.skip('should calculate correct score and statistics', async () => {
      // Complete a test with known answers
      const { getByText, rerender } = render(
        <AuthProvider>
          <Provider store={store}>
            <QuestionScreen />
          </Provider>
        </AuthProvider>
      );

      // Answer all questions correctly
      fireEvent.press(getByText('30 km/h')); // Correct
      fireEvent.press(getByText('Bekreft svar'));

      await waitFor(() => {
        expect(getByText('In emergency situations')).toBeTruthy();
      });
      fireEvent.press(getByText('In emergency situations')); // Correct
      fireEvent.press(getByText('Bekreft svar'));

      await waitFor(() => {
        expect(getByText('Stop if safe')).toBeTruthy();
      });
      fireEvent.press(getByText('Stop if safe')); // Correct
      fireEvent.press(getByText('Fullfør'));

      // Navigate to results
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('TestResults');
      });

      // Render results screen
      rerender(
        <Provider store={store}>
          <TestResultsScreen />
        </Provider>
      );

      // Should show perfect score
      await waitFor(() => {
        expect(getByText('3 av 3 riktige')).toBeTruthy();
        expect(getByText('100%')).toBeTruthy();
        expect(getByText('🏆 Perfekt! Du klarte alle riktig!')).toBeTruthy();
      });
    });

    it.skip('should show category breakdown in results', async () => {
      // Store should already have answers from previous test
      store.dispatch({
        type: 'test/answerQuestion',
        payload: { questionId: '1', selectedAnswer: 0, timeSpent: 5000 },
      });
      store.dispatch({
        type: 'test/answerQuestion',
        payload: { questionId: '2', selectedAnswer: 2, timeSpent: 3000 },
      });
      store.dispatch({
        type: 'test/answerQuestion',
        payload: { questionId: '3', selectedAnswer: 1, timeSpent: 4000 },
      });
      store.dispatch({ type: 'test/finishTest' });

      const { getByText } = render(
        <AuthProvider>
          <Provider store={store}>
            <TestResultsScreen route={{ params: { testId: 'test-123' } }} navigation={{}} />
          </Provider>
        </AuthProvider>
      );

      // Should show category statistics
      await waitFor(() => {
        expect(getByText('Kategoriresultater')).toBeTruthy();
        expect(getByText('traffic-rules')).toBeTruthy();
        expect(getByText('safety')).toBeTruthy();
        expect(getByText('traffic-signals')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it.skip('should handle empty question list gracefully', () => {
      const emptyStore = configureStore({
        reducer: {
          test: testReducer,
          results: resultsReducer,
        },
        preloadedState: {
          test: {
            questions: [],
            currentQuestionIndex: 0,
            answers: [],
            startTime: Date.now(),
            endTime: null,
          },
        },
      });

      const { queryByText } = render(
        <AuthProvider>
          <Provider store={emptyStore}>
            <QuestionScreen />
          </Provider>
        </AuthProvider>
      );

      // Should handle empty state without crashing
      expect(queryByText('Spørsmål 1 av 0')).toBeFalsy();
    });
  });
});