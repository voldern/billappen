import { Question } from '../types';
import questionsData from '../assets/data/questions.json';

export class QuestionService {
  private questions: Question[] = questionsData.questions;

  getAllQuestions(): Question[] {
    return this.questions;
  }

  getQuestionById(id: string): Question | undefined {
    return this.questions.find(q => q.id === id);
  }

  getQuestionsByCategory(category: string): Question[] {
    return this.questions.filter(q => q.category === category);
  }

  getRandomQuestions(count: number): Question[] {
    const shuffled = [...this.questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, this.questions.length));
  }

  getCategories(): string[] {
    const categories = new Set(this.questions.map(q => q.category));
    return Array.from(categories);
  }

  validateAnswer(questionId: string, selectedAnswer: number): boolean {
    const question = this.getQuestionById(questionId);
    return question ? question.correctAnswer === selectedAnswer : false;
  }
}

export default new QuestionService();