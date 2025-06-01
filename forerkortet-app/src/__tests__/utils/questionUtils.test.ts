import {
  reduceQuestionOptions,
  processQuestionsWithReducedOptions,
} from '../../utils/questionUtils';
import { Question } from '../../types';

describe('questionUtils', () => {
  describe('reduceQuestionOptions', () => {
    it('should reduce options to exactly 4', () => {
      const question: Question = {
        id: '1',
        question: 'Test question',
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
        correctAnswer: 2, // 'C' is correct
        explanation: 'Test explanation',
        category: 'test',
      };

      const reduced = reduceQuestionOptions(question);

      expect(reduced.options).toHaveLength(4);
      expect(reduced.options).toContain('C'); // Correct answer must be included
    });

    it('should update correctAnswer index to match new position', () => {
      const question: Question = {
        id: '1',
        question: 'Test question',
        options: ['Wrong1', 'Wrong2', 'Correct', 'Wrong3', 'Wrong4', 'Wrong5'],
        correctAnswer: 2,
        explanation: 'Test explanation',
        category: 'test',
      };

      const reduced = reduceQuestionOptions(question);
      const correctAnswerText = 'Correct';
      const newCorrectIndex = reduced.options.indexOf(correctAnswerText);

      expect(reduced.correctAnswer).toBe(newCorrectIndex);
      expect(reduced.options[reduced.correctAnswer]).toBe(correctAnswerText);
    });

    it('should handle questions with exactly 4 options', () => {
      const question: Question = {
        id: '1',
        question: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 1,
        explanation: 'Test explanation',
        category: 'test',
      };

      const reduced = reduceQuestionOptions(question);

      expect(reduced.options).toHaveLength(4);
      expect(reduced.options).toContain('B'); // Correct answer
    });

    it('should handle questions with less than 4 options', () => {
      const question: Question = {
        id: '1',
        question: 'Test question',
        options: ['A', 'B', 'C'],
        correctAnswer: 0,
        explanation: 'Test explanation',
        category: 'test',
      };

      const reduced = reduceQuestionOptions(question);

      expect(reduced.options).toHaveLength(3);
      expect(reduced.options).toContain('A'); // Correct answer
    });

    it('should randomize option order', () => {
      const question: Question = {
        id: '1',
        question: 'Test question',
        options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        correctAnswer: 0,
        explanation: 'Test explanation',
        category: 'test',
      };

      // Run multiple times to check randomization
      const results = new Set();
      for (let i = 0; i < 20; i++) {
        const reduced = reduceQuestionOptions(question);
        results.add(reduced.options.join(','));
      }

      // With randomization, we should get different orders
      expect(results.size).toBeGreaterThan(1);
    });

    it('should preserve other question properties', () => {
      const question: Question = {
        id: '123',
        question: 'What is 2 + 2?',
        options: ['1', '2', '3', '4', '5', '6'],
        correctAnswer: 3,
        explanation: 'Basic math',
        category: 'math',
        imageUrl: 'https://example.com/image.png',
      };

      const reduced = reduceQuestionOptions(question);

      expect(reduced.id).toBe(question.id);
      expect(reduced.question).toBe(question.question);
      expect(reduced.explanation).toBe(question.explanation);
      expect(reduced.category).toBe(question.category);
      expect(reduced.imageUrl).toBe(question.imageUrl);
    });
  });

  describe('processQuestionsWithReducedOptions', () => {
    it('should process multiple questions', () => {
      const questions: Question[] = [
        {
          id: '1',
          question: 'Question 1',
          options: ['A', 'B', 'C', 'D', 'E'],
          correctAnswer: 0,
          explanation: 'Explanation 1',
          category: 'cat1',
        },
        {
          id: '2',
          question: 'Question 2',
          options: ['W', 'X', 'Y', 'Z', 'AA', 'BB'],
          correctAnswer: 2,
          explanation: 'Explanation 2',
          category: 'cat2',
        },
      ];

      const processed = processQuestionsWithReducedOptions(questions);

      expect(processed).toHaveLength(2);
      processed.forEach((q, index) => {
        expect(q.options).toHaveLength(4);
        expect(q.id).toBe(questions[index].id);
        // Correct answer text should be preserved
        const originalCorrectAnswer = questions[index].options[questions[index].correctAnswer];
        expect(q.options).toContain(originalCorrectAnswer);
      });
    });

    it('should handle empty array', () => {
      const processed = processQuestionsWithReducedOptions([]);
      expect(processed).toEqual([]);
    });

    it('should maintain correct answer validity for all questions', () => {
      const questions: Question[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        question: `Question ${i}`,
        options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        correctAnswer: i % 7, // Different correct answers
        explanation: `Explanation ${i}`,
        category: 'test',
      }));

      const processed = processQuestionsWithReducedOptions(questions);

      processed.forEach((q, index) => {
        const originalCorrectText = questions[index].options[questions[index].correctAnswer];
        const processedCorrectText = q.options[q.correctAnswer];
        expect(processedCorrectText).toBe(originalCorrectText);
      });
    });
  });
});