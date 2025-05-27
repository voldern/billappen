import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Question, Answer, TestState } from '../types';

const initialState: TestState = {
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  startTime: 0,
  endTime: null,
};

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    startTest: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
      state.currentQuestionIndex = 0;
      state.answers = [];
      state.startTime = Date.now();
      state.endTime = null;
    },
    answerQuestion: (state, action: PayloadAction<{ questionId: string; selectedAnswer: number; timeSpent: number }>) => {
      const { questionId, selectedAnswer, timeSpent } = action.payload;
      const question = state.questions.find(q => q.id === questionId);
      
      if (question) {
        const isCorrect = selectedAnswer === question.correctAnswer;
        state.answers.push({
          questionId,
          selectedAnswer,
          isCorrect,
          timeSpent,
        });
      }
    },
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
      }
    },
    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
      }
    },
    finishTest: (state) => {
      state.endTime = Date.now();
    },
    resetTest: (state) => {
      return initialState;
    },
  },
});

export const { startTest, answerQuestion, nextQuestion, previousQuestion, finishTest, resetTest } = testSlice.actions;
export default testSlice.reducer;