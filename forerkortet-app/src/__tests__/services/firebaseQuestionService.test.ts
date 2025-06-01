import firebaseQuestionService from '../../services/firebaseQuestionService';
import { mockFirestore } from '../../test-utils/firebase-mocks';
import { Question, Category, TestResult } from '../../types';

describe('FirebaseQuestionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllQuestions', () => {
    it('should fetch all questions from Firestore', async () => {
      const mockQuestions = [
        { id: '1', question: 'Test 1', options: ['A', 'B'], correctAnswer: 0 },
        { id: '2', question: 'Test 2', options: ['C', 'D'], correctAnswer: 1 },
      ];

      const mockSnapshot = {
        docs: mockQuestions.map((q) => ({
          id: q.id,
          data: () => ({ ...q, createdAt: { toDate: () => new Date() } }),
        })),
      };

      mockFirestore.collection.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSnapshot),
      });

      const result = await firebaseQuestionService.getAllQuestions();

      expect(mockFirestore.collection).toHaveBeenCalledWith('questions');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].question).toBe('Test 1');
    });

    it('should handle errors when fetching questions', async () => {
      const error = new Error('Firestore error');
      mockFirestore.collection.mockReturnValue({
        get: jest.fn().mockRejectedValue(error),
      });

      await expect(firebaseQuestionService.getAllQuestions()).rejects.toThrow(
        'Firestore error'
      );
    });
  });

  describe('getQuestionsByCategory', () => {
    it('should fetch questions by category', async () => {
      const mockQuestions = [
        { id: '1', question: 'Test 1', category: 'cat1' },
        { id: '2', question: 'Test 2', category: 'cat1' },
      ];

      const mockSnapshot = {
        docs: mockQuestions.map((q) => ({
          id: q.id,
          data: () => ({ ...q }),
        })),
      };

      const whereQuery = {
        get: jest.fn().mockResolvedValue(mockSnapshot),
      };

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnValue(whereQuery),
      });

      const result = await firebaseQuestionService.getQuestionsByCategory('cat1');

      expect(mockFirestore.collection).toHaveBeenCalledWith('questions');
      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('cat1');
    });
  });

  describe('getRandomQuestions', () => {
    it('should return random questions up to the specified count', async () => {
      const mockQuestions = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        question: `Question ${i + 1}`,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
      }));

      const mockSnapshot = {
        docs: mockQuestions.map((q) => ({
          id: q.id,
          data: () => ({ ...q }),
        })),
      };

      mockFirestore.collection.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSnapshot),
      });

      const result = await firebaseQuestionService.getRandomQuestions(5);

      expect(result).toHaveLength(5);
      expect(new Set(result.map((q) => q.id)).size).toBe(5); // All unique
    });

    it('should filter by category when categoryId is provided', async () => {
      const mockQuestions = [
        { id: '1', question: 'Test 1', category: 'cat1' },
        { id: '2', question: 'Test 2', category: 'cat1' },
      ];

      const mockSnapshot = {
        docs: mockQuestions.map((q) => ({
          id: q.id,
          data: () => ({ ...q }),
        })),
      };

      const whereQuery = {
        get: jest.fn().mockResolvedValue(mockSnapshot),
      };

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnValue(whereQuery),
      });

      const result = await firebaseQuestionService.getRandomQuestions(2, 'cat1');

      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('cat1');
    });
  });

  describe('getCategories', () => {
    it('should fetch categories ordered by order field', async () => {
      const mockCategories = [
        { id: '1', name: 'Category 1', order: 1 },
        { id: '2', name: 'Category 2', order: 2 },
      ];

      const mockSnapshot = {
        docs: mockCategories.map((c) => ({
          id: c.id,
          data: () => ({ ...c }),
        })),
      };

      const orderByQuery = {
        get: jest.fn().mockResolvedValue(mockSnapshot),
      };

      mockFirestore.collection.mockReturnValue({
        orderBy: jest.fn().mockReturnValue(orderByQuery),
      });

      const result = await firebaseQuestionService.getCategories();

      expect(mockFirestore.collection).toHaveBeenCalledWith('categories');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Category 1');
      expect(result[0].order).toBe(1);
    });
  });

  describe('saveTestResult', () => {
    const mockUserId = 'user123';
    const mockTestResult = {
      totalQuestions: 10,
      correctAnswers: 8,
      score: 80,
      duration: 300000,
      categories: {
        cat1: { total: 5, correct: 4 },
        cat2: { total: 5, correct: 4 },
      },
      answers: [],
    };

    it('should save test result and update user progress', async () => {
      const mockTestResultRef = { id: 'test123' };
      const mockUserProgressData = {
        totalTests: 5,
        totalQuestions: 50,
        correctAnswers: 40,
      };

      // Mock user progress document
      const userProgressDoc = {
        exists: () => true,
        data: () => mockUserProgressData,
      };

      const userProgressRef = {
        get: jest.fn().mockResolvedValue(userProgressDoc),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
      };

      // Mock test results collection
      const testResultsCollection = {
        add: jest.fn().mockResolvedValue(mockTestResultRef),
      };

      // Mock category progress
      const categoryProgressRef = {
        get: jest.fn().mockResolvedValue({ exists: () => false }),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
      };

      const categoryProgressCollection = {
        doc: jest.fn().mockReturnValue(categoryProgressRef),
      };

      const userProgressDocRef = {
        get: jest.fn().mockResolvedValue(userProgressDoc),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        collection: jest.fn((name) => {
          if (name === 'testResults') return testResultsCollection;
          if (name === 'categoryProgress') return categoryProgressCollection;
        }),
      };

      const userProgressCollection = {
        doc: jest.fn().mockReturnValue(userProgressDocRef),
      };

      mockFirestore.collection.mockImplementation((name) => {
        if (name === 'userProgress') return userProgressCollection;
      });

      const result = await firebaseQuestionService.saveTestResult(
        mockUserId,
        mockTestResult
      );

      expect(result).toBe('test123');
      expect(testResultsCollection.add).toHaveBeenCalled();
      expect(userProgressDocRef.update).toHaveBeenCalled();
    });

    it('should handle errors when saving test result', async () => {
      const error = new Error('Save failed');

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockRejectedValue(error),
        }),
      });

      await expect(
        firebaseQuestionService.saveTestResult(mockUserId, mockTestResult)
      ).rejects.toThrow('Save failed');
    });
  });

  describe('getUserTestResults', () => {
    it('should fetch user test results ordered by date', async () => {
      const mockResults = [
        {
          id: 'test1',
          totalQuestions: 10,
          correctAnswers: 8,
          completedAt: { toDate: () => new Date('2024-01-01') },
        },
        {
          id: 'test2',
          totalQuestions: 10,
          correctAnswers: 9,
          completedAt: { toDate: () => new Date('2024-01-02') },
        },
      ];

      const mockSnapshot = {
        docs: mockResults.map((r) => ({
          id: r.id,
          data: () => ({ ...r }),
        })),
      };

      const limitQuery = {
        get: jest.fn().mockResolvedValue(mockSnapshot),
      };

      const orderByQuery = {
        limit: jest.fn().mockReturnValue(limitQuery),
      };

      const testResultsCollection = {
        orderBy: jest.fn().mockReturnValue(orderByQuery),
      };

      const userProgressDoc = {
        collection: jest.fn().mockReturnValue(testResultsCollection),
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(userProgressDoc),
      });

      const result = await firebaseQuestionService.getUserTestResults('user123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test1');
      expect(result[0].userId).toBe('user123');
      expect(testResultsCollection.orderBy).toHaveBeenCalledWith(
        'completedAt',
        'desc'
      );
      expect(orderByQuery.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('getUserProgress', () => {
    it('should fetch user progress document', async () => {
      const mockProgressData = {
        totalTests: 10,
        totalQuestions: 100,
        correctAnswers: 85,
        averageScore: 85,
      };

      const userProgressDoc = {
        exists: () => true,
        data: () => mockProgressData,
      };

      const userProgressRef = {
        get: jest.fn().mockResolvedValue(userProgressDoc),
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(userProgressRef),
      });

      const result = await firebaseQuestionService.getUserProgress('user123');

      expect(result).toEqual(mockProgressData);
      expect(mockFirestore.collection).toHaveBeenCalledWith('userProgress');
    });

    it('should return null if user progress does not exist', async () => {
      const userProgressDoc = {
        exists: () => false,
      };

      const userProgressRef = {
        get: jest.fn().mockResolvedValue(userProgressDoc),
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(userProgressRef),
      });

      const result = await firebaseQuestionService.getUserProgress('user123');

      expect(result).toBeNull();
    });
  });
});