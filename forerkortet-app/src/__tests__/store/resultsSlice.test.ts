import resultsReducer, {
  setResults,
  addResult,
  setLoading
} from '../../store/resultsSlice';
import { TestResult } from '../../types';

describe('resultsSlice', () => {
  const mockResult: TestResult = {
    id: '1',
    date: '2024-01-01T12:00:00Z',
    score: 8,
    totalQuestions: 10,
    duration: 300000,
    answers: [
      { questionId: '1', selectedAnswer: 0, isCorrect: true, timeSpent: 30000 },
      { questionId: '2', selectedAnswer: 1, isCorrect: false, timeSpent: 25000 }
    ]
  };

  const initialState = {
    results: [],
    isLoading: false,
  };

  it('should handle initial state', () => {
    expect(resultsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setResults', () => {
    const results = [mockResult];
    const actual = resultsReducer(initialState, setResults(results));
    expect(actual.results).toEqual(results);
  });

  it('should handle addResult', () => {
    const actual = resultsReducer(initialState, addResult(mockResult));
    expect(actual.results).toHaveLength(1);
    expect(actual.results[0]).toEqual(mockResult);
  });

  it('should add new result at the beginning', () => {
    const existingResult: TestResult = {
      ...mockResult,
      id: '2',
      date: '2024-01-02T12:00:00Z'
    };
    
    const state = {
      ...initialState,
      results: [existingResult]
    };
    
    const actual = resultsReducer(state, addResult(mockResult));
    expect(actual.results).toHaveLength(2);
    expect(actual.results[0]).toEqual(mockResult);
    expect(actual.results[1]).toEqual(existingResult);
  });

  it('should handle setLoading', () => {
    const actual = resultsReducer(initialState, setLoading(true));
    expect(actual.isLoading).toBe(true);
    
    const actual2 = resultsReducer(actual, setLoading(false));
    expect(actual2.isLoading).toBe(false);
  });
});