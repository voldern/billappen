#!/usr/bin/env python3
"""Import road sign questions to Supabase database."""

import json
import os
from pathlib import Path
from typing import List, Dict, Any
import asyncio
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def load_sign_questions(output_dir: Path) -> List[Dict[str, Any]]:
    """Load all sign questions from the output directory."""
    all_questions = []
    
    for json_file in output_dir.glob("sign_*.json"):
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                questions = data.get("questions", [])
                all_questions.extend(questions)
        except Exception as e:
            print(f"Error loading {json_file}: {e}")
    
    return all_questions


def prepare_question_for_db(question: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare a question for database insertion."""
    return {
        "question": question["question"],
        "correct_answer": question["correctAnswer"],
        "explanation": question["explanation"],
        "category": question.get("category", "Road Signs"),
        "image_url": question.get("imageUrl"),
        "sign_id": question.get("signId"),
        "difficulty": question.get("difficulty", "medium"),
        "source_question_id": question["id"],  # To prevent duplicates
    }


def prepare_answer_options(question: Dict[str, Any], question_id: str) -> List[Dict[str, Any]]:
    """Prepare answer options for database insertion."""
    options = []
    for idx, option_text in enumerate(question.get("options", [])):
        options.append({
            "question_id": question_id,
            "option_text": option_text,
            "option_index": idx,
        })
    return options


async def import_questions_batch(questions: List[Dict[str, Any]], batch_size: int = 50):
    """Import questions in batches."""
    total_questions = len(questions)
    imported_count = 0
    skipped_count = 0
    error_count = 0
    
    print(f"Starting import of {total_questions} questions...")
    
    for i in range(0, total_questions, batch_size):
        batch = questions[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total_questions + batch_size - 1) // batch_size
        
        print(f"\nProcessing batch {batch_num}/{total_batches}...")
        
        for question in batch:
            try:
                # Check if question already exists
                existing = supabase.table("questions").select("id").eq(
                    "source_question_id", question["id"]
                ).execute()
                
                if existing.data:
                    print(f"  Skipping duplicate: {question['id']}")
                    skipped_count += 1
                    continue
                
                # Prepare question data
                question_data = prepare_question_for_db(question)
                
                # Insert question
                result = supabase.table("questions").insert(question_data).execute()
                
                if result.data:
                    question_id = result.data[0]["id"]
                    
                    # Insert answer options
                    options_data = prepare_answer_options(question, question_id)
                    supabase.table("answer_options").insert(options_data).execute()
                    
                    imported_count += 1
                    print(f"  ✓ Imported: {question['id']} - {question['question'][:50]}...")
                else:
                    error_count += 1
                    print(f"  ✗ Failed to import: {question['id']}")
                    
            except Exception as e:
                error_count += 1
                print(f"  ✗ Error importing {question['id']}: {str(e)}")
        
        # Small delay between batches to avoid rate limiting
        await asyncio.sleep(0.5)
    
    print(f"\n{'='*60}")
    print(f"Import Summary:")
    print(f"  Total questions: {total_questions}")
    print(f"  Successfully imported: {imported_count}")
    print(f"  Skipped (duplicates): {skipped_count}")
    print(f"  Errors: {error_count}")
    print(f"{'='*60}")


async def main():
    """Main function to run the import."""
    # Path to the output directory with sign questions
    output_dir = Path("data/output/signs")
    
    if not output_dir.exists():
        print(f"Error: Output directory not found: {output_dir}")
        return
    
    # Load all questions
    questions = load_sign_questions(output_dir)
    
    if not questions:
        print("No questions found to import.")
        return
    
    print(f"Found {len(questions)} questions to import.")
    
    # Confirm before proceeding
    response = input("\nDo you want to proceed with the import? (y/N): ")
    if response.lower() != 'y':
        print("Import cancelled.")
        return
    
    # Run the import
    await import_questions_batch(questions)
    
    # Verify the import
    print("\nVerifying import...")
    
    # Get count by category
    categories_result = supabase.table("questions").select("category").execute()
    if categories_result.data:
        category_counts = {}
        for row in categories_result.data:
            cat = row["category"]
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        print("\nQuestions by category:")
        for cat, count in sorted(category_counts.items()):
            print(f"  {cat}: {count}")
    
    # Get count of questions with images
    image_result = supabase.table("questions").select("id").not_.is_("sign_id", "null").execute()
    if image_result.data:
        print(f"\nQuestions with sign images: {len(image_result.data)}")


if __name__ == "__main__":
    asyncio.run(main())