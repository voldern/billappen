import { configureStore } from '@reduxjs/toolkit';
import testReducer from './testSlice';
import resultsReducer from './resultsSlice';

export const store = configureStore({
  reducer: {
    test: testReducer,
    results: resultsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;