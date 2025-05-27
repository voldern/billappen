import { Question } from "../types";
import { supabase } from "../lib/supabase";

export class SupabaseQuestionService {
  // Helper method to select 1 correct + 3 random incorrect options
  private selectRandomOptions(allOptions: any[], correctOption: any): any[] {
    if (allOptions.length <= 4) {
      // If we have 4 or fewer options, return all of them
      return allOptions;
    }
    
    // Get all incorrect options
    const incorrectOptions = allOptions.filter(
      (opt) => opt.option_index !== correctOption.option_index
    );
    
    // Randomly select 3 incorrect options
    const shuffled = [...incorrectOptions].sort(() => Math.random() - 0.5);
    const selectedIncorrect = shuffled.slice(0, 3);
    
    // Combine correct option with selected incorrect options
    const selectedOptions = [correctOption, ...selectedIncorrect];
    
    // Shuffle the final array so correct answer isn't always first
    return selectedOptions.sort(() => Math.random() - 0.5);
  }
  async getAllQuestions(): Promise<Question[]> {
    try {
      // Fetch questions with their answer options using a join
      // This approach ensures we get all related data in one query
      const { data: questionsWithOptions, error } = await supabase
        .from("questions")
        .select(`
          *,
          answer_options (
            id,
            option_text,
            option_index
          )
        `)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Map database format to app format
      const formattedQuestions: Question[] =
        questionsWithOptions?.map((q) => {
          // Sort options by option_index
          const allOptions = (q.answer_options || []).sort(
            (a: any, b: any) => a.option_index - b.option_index
          );
          
          // Find the correct answer option
          const correctOption = allOptions.find(
            (opt: any) => opt.option_index === q.correct_answer
          );
          
          if (!correctOption) {
            console.warn(
              `Could not find correct answer option for question ${q.id}. ` +
              `Looking for option_index ${q.correct_answer} among ${allOptions.length} options.`
            );
            // Fallback: use first option as correct
            const selectedOptions = this.selectRandomOptions(allOptions, allOptions[0]);
            return {
              id: q.id,
              question: q.question,
              options: selectedOptions.map((opt: any) => opt.option_text),
              correctAnswer: 0,
              explanation: q.explanation,
              category: q.category,
              signId: q.sign_id,
              imageUrl: q.image_url,
              difficulty: q.difficulty,
            };
          }
          
          // Select 1 correct + 3 random incorrect options
          const selectedOptions = this.selectRandomOptions(allOptions, correctOption);
          
          // Find the index of the correct answer in the selected options
          const correctAnswerIndex = selectedOptions.findIndex(
            (opt: any) => opt.option_index === correctOption.option_index
          );

          return {
            id: q.id,
            question: q.question,
            options: selectedOptions.map((opt: any) => opt.option_text),
            correctAnswer: correctAnswerIndex,
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
      const { data: question, error } = await supabase
        .from("questions")
        .select(`
          *,
          answer_options (
            id,
            option_text,
            option_index
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!question) return undefined;

      // Sort options by option_index
      const allOptions = (question.answer_options || []).sort(
        (a: any, b: any) => a.option_index - b.option_index
      );
      
      // Find the correct answer option
      const correctOption = allOptions.find(
        (opt: any) => opt.option_index === question.correct_answer
      );
      
      if (!correctOption) {
        console.warn(
          `Could not find correct answer option for question ${question.id}. ` +
          `Looking for option_index ${question.correct_answer} among ${allOptions.length} options.`
        );
        // Fallback: use first option as correct
        const selectedOptions = this.selectRandomOptions(allOptions, allOptions[0]);
        return {
          id: question.id,
          question: question.question,
          options: selectedOptions.map((opt: any) => opt.option_text),
          correctAnswer: 0,
          explanation: question.explanation,
          category: question.category,
          signId: question.sign_id,
          imageUrl: question.image_url,
          difficulty: question.difficulty,
        };
      }
      
      // Select 1 correct + 3 random incorrect options
      const selectedOptions = this.selectRandomOptions(allOptions, correctOption);
      
      // Find the index of the correct answer in the selected options
      const correctAnswerIndex = selectedOptions.findIndex(
        (opt: any) => opt.option_index === correctOption.option_index
      );

      return {
        id: question.id,
        question: question.question,
        options: selectedOptions.map((opt: any) => opt.option_text),
        correctAnswer: correctAnswerIndex,
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
      const { data: questionsWithOptions, error } = await supabase
        .from("questions")
        .select(`
          *,
          answer_options (
            id,
            option_text,
            option_index
          )
        `)
        .eq("category", category)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const formattedQuestions: Question[] =
        questionsWithOptions?.map((q) => {
          // Sort options by option_index
          const allOptions = (q.answer_options || []).sort(
            (a: any, b: any) => a.option_index - b.option_index
          );
          
          // Find the correct answer option
          const correctOption = allOptions.find(
            (opt: any) => opt.option_index === q.correct_answer
          );
          
          if (!correctOption) {
            console.warn(
              `Could not find correct answer option for question ${q.id}. ` +
              `Looking for option_index ${q.correct_answer} among ${allOptions.length} options.`
            );
            // Fallback: use first option as correct
            const selectedOptions = this.selectRandomOptions(allOptions, allOptions[0]);
            return {
              id: q.id,
              question: q.question,
              options: selectedOptions.map((opt: any) => opt.option_text),
              correctAnswer: 0,
              explanation: q.explanation,
              category: q.category,
              signId: q.sign_id,
              imageUrl: q.image_url,
              difficulty: q.difficulty,
            };
          }
          
          // Select 1 correct + 3 random incorrect options
          const selectedOptions = this.selectRandomOptions(allOptions, correctOption);
          
          // Find the index of the correct answer in the selected options
          const correctAnswerIndex = selectedOptions.findIndex(
            (opt: any) => opt.option_index === correctOption.option_index
          );

          return {
            id: q.id,
            question: q.question,
            options: selectedOptions.map((opt: any) => opt.option_text),
            correctAnswer: correctAnswerIndex,
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
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('No authenticated user found:', userError);
        return null;
      }

      // Insert test result
      const { data: testResult, error: testError } = await supabase
        .from("test_results")
        .insert({
          user_id: user.id,
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