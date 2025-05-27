export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      questions: {
        Row: {
          id: string;
          question: string;
          correct_answer: number;
          explanation: string;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          correct_answer: number;
          explanation: string;
          category: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          correct_answer?: number;
          explanation?: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      answer_options: {
        Row: {
          id: string;
          question_id: string;
          option_text: string;
          option_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          option_text: string;
          option_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          option_text?: string;
          option_index?: number;
          created_at?: string;
        };
      };
      test_results: {
        Row: {
          id: string;
          user_id: string | null;
          score: number;
          total_questions: number;
          duration: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          score: number;
          total_questions: number;
          duration: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          score?: number;
          total_questions?: number;
          duration?: number;
          created_at?: string;
        };
      };
      test_answers: {
        Row: {
          id: string;
          test_result_id: string;
          question_id: string;
          selected_answer: number;
          is_correct: boolean;
          time_spent: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          test_result_id: string;
          question_id: string;
          selected_answer: number;
          is_correct: boolean;
          time_spent: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          test_result_id?: string;
          question_id?: string;
          selected_answer?: number;
          is_correct?: boolean;
          time_spent?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
