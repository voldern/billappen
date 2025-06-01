import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase.web';
import { Question, TestResult, Category } from '../types';

class FirebaseQuestionService {
  private questionsCache: Question[] = [];
  private categoriesCache: Category[] = [];
  private lastFetch: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getAllQuestions(): Promise<Question[]> {
    const now = Date.now();
    if (this.questionsCache.length > 0 && now - this.lastFetch < this.CACHE_DURATION) {
      return this.questionsCache;
    }

    try {
      const questionsRef = collection(db, 'questions');
      const snapshot = await getDocs(questionsRef);
      
      this.questionsCache = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Question));
      
      this.lastFetch = now;
      return this.questionsCache;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  async getQuestionsByCategory(categoryId: string): Promise<Question[]> {
    try {
      const questionsRef = collection(db, 'questions');
      const q = query(questionsRef, where('category', '==', categoryId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Question));
    } catch (error) {
      console.error('Error fetching questions by category:', error);
      throw error;
    }
  }

  async getRandomQuestions(count: number): Promise<Question[]> {
    const allQuestions = await this.getAllQuestions();
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  async saveTestResult(userId: string, result: Partial<TestResult>): Promise<string> {
    try {
      const testResultRef = doc(collection(db, 'users', userId, 'testResults'));
      const testResult = {
        ...result,
        userId,
        completedAt: serverTimestamp(),
      };
      
      await setDoc(testResultRef, testResult);
      return testResultRef.id;
    } catch (error) {
      console.error('Error saving test result:', error);
      throw error;
    }
  }

  async getUserTestResults(userId: string): Promise<TestResult[]> {
    try {
      const testResultsRef = collection(db, 'users', userId, 'testResults');
      const q = query(testResultsRef, orderBy('completedAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt,
        } as TestResult;
      });
    } catch (error) {
      console.error('Error fetching user test results:', error);
      throw error;
    }
  }

  async getCategories(): Promise<Category[]> {
    if (this.categoriesCache.length > 0) {
      return this.categoriesCache;
    }

    try {
      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(query(categoriesRef, orderBy('order')));
      
      this.categoriesCache = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Category));
      
      return this.categoriesCache;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
}

const firebaseQuestionService = new FirebaseQuestionService();
export default firebaseQuestionService;