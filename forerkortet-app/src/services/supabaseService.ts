import { Question } from "../types";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

class SimpleSupabaseService {
  private baseUrl: string;
  private headers: Headers;

  constructor() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables");
    }

    this.baseUrl = `${SUPABASE_URL}/rest/v1`;
    this.headers = new Headers({
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    });
  }

  async getAllQuestions(): Promise<Question[]> {
    try {
      // Fetch questions
      const questionsResponse = await fetch(
        `${this.baseUrl}/questions?order=created_at`,
        {
          headers: this.headers,
        }
      );

      if (!questionsResponse.ok) {
        throw new Error(
          `Failed to fetch questions: ${questionsResponse.statusText}`
        );
      }

      const questions = await questionsResponse.json();

      // Fetch answer options
      const optionsResponse = await fetch(
        `${this.baseUrl}/answer_options?order=option_index`,
        {
          headers: this.headers,
        }
      );

      if (!optionsResponse.ok) {
        throw new Error(
          `Failed to fetch answer options: ${optionsResponse.statusText}`
        );
      }

      const answerOptions = await optionsResponse.json();

      // Map to app format
      const formattedQuestions: Question[] = questions.map((q: any) => {
        const options = answerOptions
          .filter((opt: any) => opt.question_id === q.id)
          .sort((a: any, b: any) => a.option_index - b.option_index)
          .map((opt: any) => opt.option_text);

        return {
          id: q.id,
          question: q.question,
          options,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
          category: q.category,
        };
      });

      return formattedQuestions;
    } catch (error) {
      console.error("Error fetching questions:", error);
      throw error;
    }
  }

  async getRandomQuestions(count: number): Promise<Question[]> {
    try {
      const allQuestions = await this.getAllQuestions();
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, allQuestions.length));
    } catch (error) {
      console.error("Error fetching random questions:", error);
      throw error;
    }
  }

  async saveTestResult(result: {
    score: number;
    totalQuestions: number;
    duration: number;
    answers: Array<{
      questionId: string;
      selectedAnswer: number;
      isCorrect: boolean;
      timeSpent: number;
    }>;
  }): Promise<string | null> {
    try {
      // Insert test result
      const testResultResponse = await fetch(`${this.baseUrl}/test_results`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          score: result.score,
          total_questions: result.totalQuestions,
          duration: result.duration,
        }),
      });

      if (!testResultResponse.ok) {
        throw new Error(
          `Failed to save test result: ${testResultResponse.statusText}`
        );
      }

      const [testResult] = await testResultResponse.json();

      // Insert test answers
      const testAnswers = result.answers.map((answer) => ({
        test_result_id: testResult.id,
        question_id: answer.questionId,
        selected_answer: answer.selectedAnswer,
        is_correct: answer.isCorrect,
        time_spent: answer.timeSpent,
      }));

      const answersResponse = await fetch(`${this.baseUrl}/test_answers`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(testAnswers),
      });

      if (!answersResponse.ok) {
        throw new Error(
          `Failed to save test answers: ${answersResponse.statusText}`
        );
      }

      return testResult.id;
    } catch (error) {
      console.error("Error saving test result:", error);
      return null;
    }
  }
}

export default new SimpleSupabaseService();
