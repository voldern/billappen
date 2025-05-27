export interface Question {
  id: string;
  text: string;
  question?: string; // Legacy support
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  signId?: string;
  imageUrl?: string;
  signImageUrl?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface TestResult {
  id: string;
  userId?: string;
  date?: string;
  completedAt?: any;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  duration?: number;
  answers?: Answer[];
  categories?: Record<string, { correct: number; total: number }>;
  categoryBreakdown?: Record<string, { correct: number; total: number }>; // Legacy support
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

export interface Category {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  order: number;
}

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResultsList: undefined;
  CategorySelection: undefined;
  NewTest: { selectedCategory?: string; categoryName?: string } | undefined;
  Question: undefined;
  TestResults: { testId: string };
  Progress: undefined;
  AdminMigration: undefined;
};