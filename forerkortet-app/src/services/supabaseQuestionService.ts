import { Question } from "../types";
import { supabase } from "../lib/supabase";

export class SupabaseQuestionService {
  async getAllQuestions(): Promise<Question[]> {
    try {
      // Fetch questions with their answer options
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: true });

      if (questionsError) throw questionsError;

      // Fetch all answer options
      const { data: answerOptions, error: optionsError } = await supabase
        .from("answer_options")
        .select("*")
        .order("option_index", { ascending: true });

      if (optionsError) throw optionsError;

      // Map database format to app format
      const formattedQuestions: Question[] =
        questions?.map((q) => {
          const options =
            answerOptions
              ?.filter((opt) => opt.question_id === q.id)
              .sort((a, b) => a.option_index - b.option_index)
              .map((opt) => opt.option_text) || [];

          return {
            id: q.id,
            question: q.question,
            options,
            correctAnswer: q.correct_answer,
            explanation: q.explanation,
            category: q.category,
            signId: q.sign_id,
            imageUrl: q.image_url,
            difficulty: q.difficulty,
          };
        }) || [];

      return formattedQuestions;
    } catch (error) {
      console.error("Error fetching questions:", error);
      throw error;
    }
  }

  async getQuestionById(id: string): Promise<Question | undefined> {
    try {
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .select("*")
        .eq("id", id)
        .single();

      if (questionError) throw questionError;

      const { data: answerOptions, error: optionsError } = await supabase
        .from("answer_options")
        .select("*")
        .eq("question_id", id)
        .order("option_index", { ascending: true });

      if (optionsError) throw optionsError;

      if (!question) return undefined;

      return {
        id: question.id,
        question: question.question,
        options: answerOptions?.map((opt) => opt.option_text) || [],
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        category: question.category,
        signId: question.sign_id,
        imageUrl: question.image_url,
        difficulty: question.difficulty,
      };
    } catch (error) {
      console.error("Error fetching question by id:", error);
      return undefined;
    }
  }

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    try {
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("category", category)
        .order("created_at", { ascending: true });

      if (questionsError) throw questionsError;

      const questionIds = questions?.map((q) => q.id) || [];

      const { data: answerOptions, error: optionsError } = await supabase
        .from("answer_options")
        .select("*")
        .in("question_id", questionIds)
        .order("option_index", { ascending: true });

      if (optionsError) throw optionsError;

      const formattedQuestions: Question[] =
        questions?.map((q) => {
          const options =
            answerOptions
              ?.filter((opt) => opt.question_id === q.id)
              .sort((a, b) => a.option_index - b.option_index)
              .map((opt) => opt.option_text) || [];

          return {
            id: q.id,
            question: q.question,
            options,
            correctAnswer: q.correct_answer,
            explanation: q.explanation,
            category: q.category,
            signId: q.sign_id,
            imageUrl: q.image_url,
            difficulty: q.difficulty,
          };
        }) || [];

      return formattedQuestions;
    } catch (error) {
      console.error("Error fetching questions by category:", error);
      throw error;
    }
  }

  async getRandomQuestions(count: number): Promise<Question[]> {
    try {
      // First get the total count
      const { count: totalCount, error: countError } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;

      // Generate random indices
      const randomIndices = new Set<number>();
      const maxCount = Math.min(count, totalCount || 0);

      while (randomIndices.size < maxCount) {
        randomIndices.add(Math.floor(Math.random() * (totalCount || 0)));
      }

      // Fetch all questions (we'll filter client-side for true randomness)
      const allQuestions = await this.getAllQuestions();

      // Select random questions
      const selectedQuestions = Array.from(randomIndices)
        .map((index) => allQuestions[index])
        .filter(Boolean);

      return selectedQuestions;
    } catch (error) {
      console.error("Error fetching random questions:", error);
      throw error;
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("category")
        .order("category", { ascending: true });

      if (error) throw error;

      // Get unique categories
      const uniqueCategories = [...new Set(data?.map((q) => q.category) || [])];
      return uniqueCategories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  validateAnswer(question: Question, selectedAnswer: number): boolean {
    return question.correctAnswer === selectedAnswer;
  }

  // Method to save test results
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
      const { data: testResult, error: testError } = await supabase
        .from("test_results")
        .insert({
          score: result.score,
          total_questions: result.totalQuestions,
          duration: result.duration,
        })
        .select()
        .single();

      if (testError) throw testError;

      // Insert test answers
      const testAnswers = result.answers.map((answer) => ({
        test_result_id: testResult.id,
        question_id: answer.questionId,
        selected_answer: answer.selectedAnswer,
        is_correct: answer.isCorrect,
        time_spent: answer.timeSpent,
      }));

      const { error: answersError } = await supabase
        .from("test_answers")
        .insert(testAnswers);

      if (answersError) throw answersError;

      return testResult.id;
    } catch (error) {
      console.error("Error saving test result:", error);
      return null;
    }
  }
}

export default new SupabaseQuestionService();
