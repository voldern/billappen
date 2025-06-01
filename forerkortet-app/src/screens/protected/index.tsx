import React from 'react';
import { AuthGuard } from '../../components/AuthGuard';
import NewTestScreen from '../NewTestScreen';
import QuestionScreen from '../QuestionScreen';
import TestResultsScreen from '../TestResultsScreen';
import ResultsListScreen from '../ResultsListScreen';
import ProgressScreen from '../ProgressScreen';
import CategorySelectionScreen from '../CategorySelectionScreen';

// Wrap each protected screen with AuthGuard
export const ProtectedNewTestScreen = (props: any) => (
  <AuthGuard>
    <NewTestScreen {...props} />
  </AuthGuard>
);

export const ProtectedQuestionScreen = (props: any) => (
  <AuthGuard>
    <QuestionScreen {...props} />
  </AuthGuard>
);

export const ProtectedTestResultsScreen = (props: any) => (
  <AuthGuard>
    <TestResultsScreen {...props} />
  </AuthGuard>
);

export const ProtectedResultsListScreen = (props: any) => (
  <AuthGuard>
    <ResultsListScreen {...props} />
  </AuthGuard>
);

export const ProtectedProgressScreen = (props: any) => (
  <AuthGuard>
    <ProgressScreen {...props} />
  </AuthGuard>
);

export const ProtectedCategorySelectionScreen = (props: any) => (
  <AuthGuard>
    <CategorySelectionScreen {...props} />
  </AuthGuard>
);