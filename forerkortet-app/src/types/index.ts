export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  signId?: string;
  imageUrl?: string;
  difficulty?: string;
}

export interface TestResult {
  id: string;
  date: string;
  score: number;
  totalQuestions: number;
  duration: number;
  answers: Answer[];
  categoryBreakdown?: Record<string, { correct: number; total: number }>;
}

export interface Answer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

export interface TestState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Answer[];
  startTime: number;
  endTime: number | null;
}

export type RootStackParamList = {
  Landing: undefined;
  ResultsList: undefined;
  NewTest: undefined;
  Question: undefined;
  TestResults: { testId: string };
  Progress: undefined;
};