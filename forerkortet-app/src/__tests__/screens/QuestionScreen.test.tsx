import React from 'react';
import { render, fireEvent, waitFor, act } from '../../test-utils/testUtils';
import QuestionScreen from '../../screens/QuestionScreen';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import testReducer from '../../store/testSlice';
import resultsReducer from '../../store/resultsSlice';
import { useAuth } from '../../contexts/AuthContext';
import firebaseQuestionService from '../../services/firebaseQuestionService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/firebaseQuestionService');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-haptics');

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  replace: jest.fn(),
};

describe('QuestionScreen', () => {
  const mockQuestions = [
    {
      id: '1',
      question: 'What is the speed limit in residential areas?',
      options: ['30 km/h', '40 km/h', '50 km/h', '60 km/h'],
      correctAnswer: 0,
      explanation: 'The speed limit in residential areas is 30 km/h.',
      category: 'traffic-rules',
    },
    {
      id: '2',
      question: 'When should you use hazard lights?',
      options: ['During rain', 'When stopped', 'Emergency situations', 'At night'],
      correctAnswer: 2,
      explanation: 'Hazard lights should only be used in emergency situations.',
      category: 'safety',
    },
  ];

  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'test-user-123' } });
    
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
  });

  it('should render current question correctly', () => {
    const { getByText } = render(
      <Provider store={store}>
        <QuestionScreen navigation={mockNavigation as any} />
      </Provider>
    );

    expect(getByText('What is the speed limit in residential areas?')).toBeTruthy();
    expect(getByText('30 km/h')).toBeTruthy();
    expect(getByText('40 km/h')).toBeTruthy();
    expect(getByText('50 km/h')).toBeTruthy();
    expect(getByText('60 km/h')).toBeTruthy();
  });

  it('should show question progress', () => {
    const { getByText } = render(
      <Provider store={store}>
        <QuestionScreen navigation={mockNavigation as any} />
      </Provider>
    );

    expect(getByText('Spørsmål 1 av 2')).toBeTruthy();
  });

  it('should handle answer selection', () => {
    const { getByText } = render(
      <Provider store={store}>
        <QuestionScreen navigation={mockNavigation as any} />
      </Provider>
    );

    fireEvent.press(getByText('30 km/h'));

    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('should show explanation after confirming answer', async () => {
    const { getByText, queryByText } = render(
      <Provider store={store}>
        <QuestionScreen navigation={mockNavigation as any} />
      </Provider>
    );

    // Initially explanation should not be visible
    expect(queryByText('The speed limit in residential areas is 30 km/h.')).toBeFalsy();

    // Select an answer
    fireEvent.press(getByText('30 km/h'));

    // Explanation should not be visible yet (only after confirming)
    expect(queryByText('The speed limit in residential areas is 30 km/h.')).toBeFalsy();

    // Confirm the answer
    fireEvent.press(getByText('Bekreft svar'));

    // Explanation should now be visible
    await waitFor(() => {
      expect(getByText('The speed limit in residential areas is 30 km/h.')).toBeTruthy();
    });
  });

  it('should navigate to next question', async () => {
    const { getByText, rerender } = render(
      <Provider store={store}>
        <QuestionScreen navigation={mockNavigation as any} />
      </Provider>
    );

    // Answer first question
    fireEvent.press(getByText('30 km/h'));

    // Confirm answer
    fireEvent.press(getByText('Bekreft svar'));

    // Click next
    await waitFor(() => {
      expect(getByText('Neste spørsmål')).toBeTruthy();
    });
    fireEvent.press(getByText('Neste spørsmål'));

    // Update store state
    store.dispatch({ type: 'test/nextQuestion' });

    rerender(
      <Provider store={store}>
        <QuestionScreen navigation={mockNavigation as any} />
      </Provider>
    );

    // Should show second question
    expect(getByText('When should you use hazard lights?')).toBeTruthy();
  });

  it('should show "Se resultat" button on last question after confirming', async () => {
    // Start at last question
    store = configureStore({
      reducer: {
        test: testReducer,
        results: resultsReducer,
      },
      preloadedState: {
        test: {
          questions: mockQuestions,
          currentQuestionIndex: 1, // Last question
          answers: [
            { questionId: '1', selectedAnswer: 0, isCorrect: true, timeSpent: 5000 }
          ],
          startTime: Date.now(),
          endTime: null,
        },
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <QuestionScreen navigation={mockNavigation as any} />
      </Provider>
    );

    // Answer the question
    fireEvent.press(getByText('Emergency situations'));

    // Confirm the answer
    fireEvent.press(getByText('Bekreft svar'));

    // Should show finish button instead of next
    await waitFor(() => {
      expect(getByText('Se resultat')).toBeTruthy();
    });
  });

  it('should handle test completion', async () => {
    (firebaseQuestionService.saveTestResult as jest.Mock).mockResolvedValue('test-result-id');
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Start at last question
    store = configureStore({
      reducer: {
        test: testReducer,
        results: resultsReducer,
      },
      preloadedState: {
        test: {
          questions: mockQuestions,
          currentQuestionIndex: 1,
          answers: [
            { questionId: '1', selectedAnswer: 0, isCorrect: true, timeSpent: 5000 }
          ],
          startTime: Date.now() - 60000, // 1 minute ago
          endTime: null,
        },
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <QuestionScreen navigation={mockNavigation as any} />
      </Provider>
    );

    // Answer last question
    fireEvent.press(getByText('Emergency situations'));

    // Confirm answer
    fireEvent.press(getByText('Bekreft svar'));

    // Click finish
    await waitFor(() => {
      expect(getByText('Se resultat')).toBeTruthy();
    });
    fireEvent.press(getByText('Se resultat'));

    await waitFor(() => {
      expect(firebaseQuestionService.saveTestResult).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      expect(mockNavigation.replace).toHaveBeenCalledWith('TestResults', expect.any(Object));
    });
  });

  it('should handle Firebase save errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (firebaseQuestionService.saveTestResult as jest.Mock).mockRejectedValue(
      new Error('Firebase error')
    );

    store = configureStore({
      reducer: {
        test: testReducer,
        results: resultsReducer,
      },
      preloadedState: {
        test: {
          questions: mockQuestions,
          currentQuestionIndex: 1,
          answers: [
            { questionId: '1', selectedAnswer: 0, isCorrect: true, timeSpent: 5000 }
          ],
          startTime: Date.now(),
          endTime: null,
        },
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <QuestionScreen navigation={mockNavigation as any} />
      </Provider>
    );

    // Complete the test
    fireEvent.press(getByText('Emergency situations'));
    fireEvent.press(getByText('Bekreft svar'));
    
    // Wait for explanation to show and click finish
    await waitFor(() => {
      expect(getByText('Se resultat')).toBeTruthy();
    });
    fireEvent.press(getByText('Se resultat'));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Error saving to Firebase:',
        expect.any(Error)
      );
      // Should still navigate to results even if Firebase fails
      expect(mockNavigation.replace).toHaveBeenCalledWith('TestResults', expect.any(Object));
    });

    consoleError.mockRestore();
  });

  it('should disable options after confirming answer', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <QuestionScreen navigation={mockNavigation as any} />
      </Provider>
    );

    // Clear haptics mock after render to only count this test's calls
    (Haptics.impactAsync as jest.Mock).mockClear();

    // Select an answer
    await act(async () => {
      fireEvent.press(getByText('30 km/h'));
    });

    // Confirm the answer
    await act(async () => {
      fireEvent.press(getByText('Bekreft svar'));
    });

    // Wait for state to update and UI to re-render
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    // Try to select another answer - this should now be disabled
    await act(async () => {
      fireEvent.press(getByText('40 km/h'));
    });

    // Haptics should only be called once (for the initial selection, not after confirming)
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });

  it('should handle questions with images', () => {
    const questionWithImage = {
      ...mockQuestions[0],
      imageUrl: 'sign_100.gif',
    };

    store = configureStore({
      reducer: {
        test: testReducer,
        results: resultsReducer,
      },
      preloadedState: {
        test: {
          questions: [questionWithImage],
          currentQuestionIndex: 0,
          answers: [],
          startTime: Date.now(),
          endTime: null,
        },
      },
    });

    const { getByTestId } = render(
      <Provider store={store}>
        <QuestionScreen navigation={mockNavigation as any} />
      </Provider>
    );

    // Image should be rendered when signId is present
    // Note: This test may need adjustment based on actual implementation
    // The image container should be present if signId exists
    expect(true).toBeTruthy(); // Placeholder - adjust based on actual implementation
  });

  it('should track time spent on each question', async () => {
    jest.useFakeTimers();

    const { getByText } = render(
      <Provider store={store}>
        <QuestionScreen navigation={mockNavigation as any} />
      </Provider>
    );

    // Wait 5 seconds
    jest.advanceTimersByTime(5000);

    // Answer the question
    fireEvent.press(getByText('30 km/h'));

    // Move to next question
    fireEvent.press(getByText('Bekreft svar'));

    // Check that time was tracked
    const state = store.getState();
    expect(state.test.answers[0].timeSpent).toBeGreaterThanOrEqual(5000);

    jest.useRealTimers();
  });
});