import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TestResult } from '../types';

interface ResultsState {
  results: TestResult[];
  isLoading: boolean;
}

const initialState: ResultsState = {
  results: [],
  isLoading: false,
};

const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setResults: (state, action: PayloadAction<TestResult[]>) => {
      state.results = action.payload;
    },
    addResult: (state, action: PayloadAction<TestResult>) => {
      state.results.unshift(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setResults, addResult, setLoading } = resultsSlice.actions;
export default resultsSlice.reducer;