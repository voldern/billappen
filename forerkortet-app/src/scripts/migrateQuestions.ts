import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env file BEFORE any other imports
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Debug: Check if environment variables are loaded
console.log("Environment variables loaded:");
console.log(
  "SUPABASE_URL:",
  process.env.EXPO_PUBLIC_SUPABASE_URL ? "Set" : "Not set"
);
console.log(
  "SUPABASE_ANON_KEY:",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set"
);

// Now import modules that depend on environment variables
import { createClient } from "@supabase/supabase-js";
import questionsData from "../assets/data/questions.json";

// Create Supabase client directly here instead of importing from config
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase environment variables");
  console.error("Please make sure your .env file contains:");
  console.error("EXPO_PUBLIC_SUPABASE_URL=your_url");
  console.error("EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function migrateQuestions() {
  console.log("Starting question migration...");

  try {
    // First, let's check if tables exist
    console.log("Checking if tables exist...");
    const { data: testQuery, error: testError } = await supabase
      .from("questions")
      .select("count")
      .limit(1);

    if (testError) {
      console.error("Error accessing questions table:", testError.message);
      console.error("Make sure you have run the schema SQL in Supabase first!");
      process.exit(1);
    }

    console.log("Tables verified, proceeding with migration...");

    // Clear existing data (optional - remove if you want to keep existing data)
    console.log("Clearing existing data...");
    await supabase
      .from("answer_options")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("test_answers")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("test_results")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("questions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // Insert questions
    console.log("Inserting questions...");
    for (const question of questionsData.questions) {
      // Insert the question (let Supabase generate the UUID)
      const { data: insertedQuestion, error: questionError } = await supabase
        .from("questions")
        .insert({
          question: question.question,
          correct_answer: question.correctAnswer,
          explanation: question.explanation,
          category: question.category,
        })
        .select()
        .single();

      if (questionError) {
        console.error(
          `Error inserting question:`,
          questionError.message || questionError
        );
        console.error("Question data:", {
          question: question.question.substring(0, 50) + "...",
          category: question.category,
        });
        continue;
      }

      // Insert answer options
      const answerOptions = question.options.map((option, index) => ({
        question_id: insertedQuestion.id,
        option_text: option,
        option_index: index,
      }));

      const { error: optionsError } = await supabase
        .from("answer_options")
        .insert(answerOptions);

      if (optionsError) {
        console.error(
          `Error inserting options for question:`,
          optionsError.message || optionsError
        );
      } else {
        console.log(
          `Successfully migrated question: ${question.question.substring(
            0,
            50
          )}...`
        );
      }
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Run the migration
migrateQuestions();
