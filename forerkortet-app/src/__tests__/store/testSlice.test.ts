import testReducer, {
  startTest,
  answerQuestion,
  nextQuestion,
  previousQuestion,
  finishTest,
  resetTest
} from '../../store/testSlice';
import { Question } from '../../types';

describe('testSlice', () => {
  const mockQuestions: Question[] = [
    {
      id: '1',
      question: 'Test question 1',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      explanation: 'Explanation 1',
      category: 'Test'
    },
    {
      id: '2',
      question: 'Test question 2',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 1,
      explanation: 'Explanation 2',
      category: 'Test'
    }
  ];

  const initialState = {
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    startTime: 0,
    endTime: null,
  };

  it('should handle initial state', () => {
    expect(testReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle startTest', () => {
    const actual = testReducer(initialState, startTest(mockQuestions));
    expect(actual.questions).toEqual(mockQuestions);
    expect(actual.currentQuestionIndex).toBe(0);
    expect(actual.answers).toEqual([]);
    expect(actual.startTime).toBeGreaterThan(0);
    expect(actual.endTime).toBeNull();
  });

  it('should handle answerQuestion', () => {
    const state = {
      ...initialState,
      questions: mockQuestions,
    };
    
    const actual = testReducer(state, answerQuestion({
      questionId: '1',
      selectedAnswer: 0,
      timeSpent: 5000
    }));
    
    expect(actual.answers).toHaveLength(1);
    expect(actual.answers[0]).toEqual({
      questionId: '1',
      selectedAnswer: 0,
      isCorrect: true,
      timeSpent: 5000
    });
  });

  it('should handle nextQuestion', () => {
    const state = {
      ...initialState,
      questions: mockQuestions,
      currentQuestionIndex: 0
    };
    
    const actual = testReducer(state, nextQuestion());
    expect(actual.currentQuestionIndex).toBe(1);
  });

  it('should not go beyond last question', () => {
    const state = {
      ...initialState,
      questions: mockQuestions,
      currentQuestionIndex: 1
    };
    
    const actual = testReducer(state, nextQuestion());
    expect(actual.currentQuestionIndex).toBe(1);
  });

  it('should handle previousQuestion', () => {
    const state = {
      ...initialState,
      questions: mockQuestions,
      currentQuestionIndex: 1
    };
    
    const actual = testReducer(state, previousQuestion());
    expect(actual.currentQuestionIndex).toBe(0);
  });

  it('should not go before first question', () => {
    const state = {
      ...initialState,
      questions: mockQuestions,
      currentQuestionIndex: 0
    };
    
    const actual = testReducer(state, previousQuestion());
    expect(actual.currentQuestionIndex).toBe(0);
  });

  it('should handle finishTest', () => {
    const state = {
      ...initialState,
      startTime: Date.now() - 60000,
    };
    
    const actual = testReducer(state, finishTest());
    expect(actual.endTime).toBeGreaterThan(0);
  });

  it('should handle resetTest', () => {
    const state = {
      questions: mockQuestions,
      currentQuestionIndex: 1,
      answers: [{ questionId: '1', selectedAnswer: 0, isCorrect: true, timeSpent: 5000 }],
      startTime: Date.now(),
      endTime: Date.now() + 60000,
    };
    
    const actual = testReducer(state, resetTest());
    expect(actual).toEqual(initialState);
  });
});