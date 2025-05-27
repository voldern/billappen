import firestore from '@react-native-firebase/firestore';
import crashlytics from '@react-native-firebase/crashlytics';
import { Question, Category, TestResult } from '../types';

class FirebaseQuestionService {
  async getAllQuestions(): Promise<Question[]> {
    try {
      const snapshot = await firestore().collection('questions').get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to ISO strings
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
        };
      }) as Question[];
    } catch (error) {
      console.error('Error fetching questions:', error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async getQuestionsByCategory(categoryId: string): Promise<Question[]> {
    try {
      const snapshot = await firestore()
        .collection('questions')
        .where('category', '==', categoryId)
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to ISO strings
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
        };
      }) as Question[];
    } catch (error) {
      console.error('Error fetching questions by category:', error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async getRandomQuestions(count: number, categoryId?: string): Promise<Question[]> {
    try {
      let questions: Question[];
      
      if (categoryId) {
        questions = await this.getQuestionsByCategory(categoryId);
      } else {
        questions = await this.getAllQuestions();
      }
      
      // Shuffle and slice
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    } catch (error) {
      console.error('Error fetching random questions:', error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const snapshot = await firestore()
        .collection('categories')
        .orderBy('order', 'asc')
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert any timestamps if they exist
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
        };
      }) as Category[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async saveTestResult(userId: string, result: Omit<TestResult, 'id' | 'userId'>): Promise<string> {
    try {
      // Save test result
      const testResultRef = await firestore()
        .collection('userProgress')
        .doc(userId)
        .collection('testResults')
        .add({
          ...result,
          completedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Update user progress
      const userProgressRef = firestore().collection('userProgress').doc(userId);
      const userProgressDoc = await userProgressRef.get();

      if (userProgressDoc.exists) {
        // Update existing progress
        const currentData = userProgressDoc.data() || {};
        const newTotalTests = (currentData.totalTests || 0) + 1;
        const newTotalQuestions = (currentData.totalQuestions || 0) + result.totalQuestions;
        const newCorrectAnswers = (currentData.correctAnswers || 0) + result.correctAnswers;
        const newAverageScore = (newCorrectAnswers / newTotalQuestions) * 100;

        await userProgressRef.update({
          totalTests: newTotalTests,
          totalQuestions: newTotalQuestions,
          correctAnswers: newCorrectAnswers,
          averageScore: newAverageScore,
          lastTestDate: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Create new progress record
        await userProgressRef.set({
          userId,
          totalTests: 1,
          totalQuestions: result.totalQuestions,
          correctAnswers: result.correctAnswers,
          averageScore: result.percentage,
          lastTestDate: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      // Update category progress
      for (const [categoryId, categoryData] of Object.entries(result.categories || {})) {
        const categoryProgressRef = firestore()
          .collection('userProgress')
          .doc(userId)
          .collection('categoryProgress')
          .doc(categoryId);
        const categoryProgressDoc = await categoryProgressRef.get();

        if (categoryProgressDoc.exists) {
          await categoryProgressRef.update({
            questionsAnswered: firestore.FieldValue.increment(categoryData.total),
            correctAnswers: firestore.FieldValue.increment(categoryData.correct),
            lastAttempt: firestore.FieldValue.serverTimestamp(),
          });
        } else {
          await categoryProgressRef.set({
            categoryId,
            questionsAnswered: categoryData.total,
            correctAnswers: categoryData.correct,
            lastAttempt: firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      return testResultRef.id;
    } catch (error) {
      console.error('Error saving test result:', error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async getUserTestResults(userId: string): Promise<TestResult[]> {
    try {
      const snapshot = await firestore()
        .collection('userProgress')
        .doc(userId)
        .collection('testResults')
        .orderBy('completedAt', 'desc')
        .limit(50)
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId,
          ...data,
          // Convert Firestore timestamp to ISO string
          completedAt: data.completedAt?.toDate?.()?.toISOString?.() || null,
          date: data.completedAt?.toDate?.()?.toISOString?.() || null,
        };
      }) as TestResult[];
    } catch (error) {
      console.error('Error fetching user test results:', error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async getUserProgress(userId: string) {
    try {
      const userProgressDoc = await firestore()
        .collection('userProgress')
        .doc(userId)
        .get();
      if (userProgressDoc.exists) {
        return userProgressDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async getCategoryProgress(userId: string, categoryId: string) {
    try {
      const categoryProgressDoc = await firestore()
        .collection('userProgress')
        .doc(userId)
        .collection('categoryProgress')
        .doc(categoryId)
        .get();
      if (categoryProgressDoc.exists) {
        return categoryProgressDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching category progress:', error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async saveUserAnswer(userId: string, answer: {
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    testId: string;
  }) {
    try {
      await firestore()
        .collection('userAnswers')
        .doc(userId)
        .collection('answers')
        .add({
          ...answer,
          answeredAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('Error saving user answer:', error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }
}

export default new FirebaseQuestionService();