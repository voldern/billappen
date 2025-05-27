import { QuestionService } from '../../services/questionService';
import { Question } from '../../types';

// Mock the questions data
jest.mock('../../assets/data/questions.json', () => ({
  questions: [
    {
      id: '1',
      question: 'Question 1',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      explanation: 'Explanation 1',
      category: 'Category A'
    },
    {
      id: '2',
      question: 'Question 2',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 1,
      explanation: 'Explanation 2',
      category: 'Category B'
    },
    {
      id: '3',
      question: 'Question 3',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 2,
      explanation: 'Explanation 3',
      category: 'Category A'
    }
  ]
}));

describe('QuestionService', () => {
  let service: QuestionService;

  beforeEach(() => {
    service = new QuestionService();
  });

  describe('getAllQuestions', () => {
    it('should return all questions', () => {
      const questions = service.getAllQuestions();
      expect(questions).toHaveLength(3);
    });
  });

  describe('getQuestionById', () => {
    it('should return question by id', () => {
      const question = service.getQuestionById('2');
      expect(question).toBeDefined();
      expect(question?.id).toBe('2');
      expect(question?.question).toBe('Question 2');
    });

    it('should return undefined for non-existent id', () => {
      const question = service.getQuestionById('999');
      expect(question).toBeUndefined();
    });
  });

  describe('getQuestionsByCategory', () => {
    it('should return questions by category', () => {
      const questions = service.getQuestionsByCategory('Category A');
      expect(questions).toHaveLength(2);
      expect(questions[0].category).toBe('Category A');
      expect(questions[1].category).toBe('Category A');
    });

    it('should return empty array for non-existent category', () => {
      const questions = service.getQuestionsByCategory('Category Z');
      expect(questions).toHaveLength(0);
    });
  });

  describe('getRandomQuestions', () => {
    it('should return requested number of questions', () => {
      const questions = service.getRandomQuestions(2);
      expect(questions).toHaveLength(2);
    });

    it('should not return more questions than available', () => {
      const questions = service.getRandomQuestions(10);
      expect(questions).toHaveLength(3);
    });

    it('should return different order on multiple calls', () => {
      // This test might occasionally fail due to randomness
      const results = new Set();
      for (let i = 0; i < 10; i++) {
        const questions = service.getRandomQuestions(3);
        results.add(questions.map(q => q.id).join(','));
      }
      // With 3 questions, there are 6 possible permutations
      // We expect to see at least 2 different orders in 10 tries
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('getCategories', () => {
    it('should return unique categories', () => {
      const categories = service.getCategories();
      expect(categories).toHaveLength(2);
      expect(categories).toContain('Category A');
      expect(categories).toContain('Category B');
    });
  });

  describe('validateAnswer', () => {
    it('should return true for correct answer', () => {
      expect(service.validateAnswer('1', 0)).toBe(true);
      expect(service.validateAnswer('2', 1)).toBe(true);
      expect(service.validateAnswer('3', 2)).toBe(true);
    });

    it('should return false for incorrect answer', () => {
      expect(service.validateAnswer('1', 1)).toBe(false);
      expect(service.validateAnswer('2', 0)).toBe(false);
      expect(service.validateAnswer('3', 0)).toBe(false);
    });

    it('should return false for non-existent question', () => {
      expect(service.validateAnswer('999', 0)).toBe(false);
    });
  });
});