"""Main question generator orchestrating the process."""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from rich.console import Console
from rich.progress import track

from ..utils.console import get_console
from ..utils.file_utils import ensure_directory
from .markdown_reader import MarkdownReader
from .models import Question, QuestionBank
from .openai_client import QuestionGeneratorClient


class QuestionGenerator:
    """Main class for generating quiz questions from theory content."""

    def __init__(
        self,
        openai_api_key: str | None = None,
        openai_api_base: str | None = None,
        model: str = "gpt-4",
        questions_per_chapter: int = 5,
        incorrect_answers_per_question: int = 20,
        console: Console | None = None,
    ):
        """Initialize the question generator.

        Args:
            openai_api_key: OpenAI API key
            openai_api_base: OpenAI API base URL
            model: Model to use for generation
            questions_per_chapter: Number of questions to generate per chapter
            incorrect_answers_per_question: Number of incorrect answers per question
            console: Optional Rich console for output
        """
        self.openai_client = QuestionGeneratorClient(
            api_key=openai_api_key, api_base=openai_api_base, model=model
        )
        self.questions_per_chapter = questions_per_chapter
        self.incorrect_answers_per_question = incorrect_answers_per_question
        self.console = console or get_console()

    def generate_from_directory(
        self, markdown_dir: Path, output_file: Path | None = None
    ) -> QuestionBank:
        """Generate questions from all markdown files in a directory."""
        self.console.print(f"[green]Reading markdown files from: {markdown_dir}[/green]")

        reader = MarkdownReader(markdown_dir)
        markdown_files = reader.find_markdown_files()

        if not markdown_files:
            self.console.print("[red]No markdown files found![/red]")
            return QuestionBank()

        self.console.print(f"[blue]Found {len(markdown_files)} markdown files[/blue]")

        question_bank = QuestionBank()
        successful_chapters = 0
        total_questions = 0

        for file_path in track(
            markdown_files, description="Processing chapters...", console=self.console
        ):
            try:
                # Parse the chapter
                chapter = reader.parse_file(file_path)
                if not chapter:
                    self.console.print(
                        f"[yellow]⚠️  Skipping {file_path.name} - insufficient content[/yellow]"
                    )
                    continue

                self.console.print(f"[cyan]Processing: {chapter.title}[/cyan]")

                # Generate questions for this chapter
                questions = self.openai_client.generate_questions(
                    chapter=chapter,
                    num_questions=self.questions_per_chapter,
                    num_incorrect_answers=self.incorrect_answers_per_question,
                )

                if questions:
                    for question in questions:
                        question_bank.add_question(question)

                    successful_chapters += 1
                    total_questions += len(questions)
                    self.console.print(
                        f"[green]✓[/green] Generated {len(questions)} questions from {chapter.title}"
                    )
                else:
                    self.console.print(
                        f"[red]❌ Failed to generate questions from {chapter.title}[/red]"
                    )

            except Exception as e:
                self.console.print(f"[red]❌ Error processing {file_path.name}: {e}[/red]")
                continue

        # Add metadata
        question_bank.metadata = {
            "total_questions": total_questions,
            "chapters_processed": successful_chapters,
            "questions_per_chapter": self.questions_per_chapter,
            "incorrect_answers_per_question": self.incorrect_answers_per_question,
            "source_directory": str(markdown_dir),
            "generated_at": datetime.now().isoformat(),
        }

        self.console.print("\n[bold green]Generation complete![/bold green]")
        self.console.print(f"Successfully processed {successful_chapters} chapters")
        self.console.print(f"Generated {total_questions} total questions")

        # Save if output file specified
        if output_file:
            self.save_question_bank(question_bank, output_file)

        return question_bank

    def generate_from_directory_separate(
        self, markdown_dir: Path, output_dir: Path
    ) -> QuestionBank:
        """Generate questions from all markdown files, creating one JSON file per chapter."""
        self.console.print(f"[green]Reading markdown files from: {markdown_dir}[/green]")

        reader = MarkdownReader(markdown_dir)
        markdown_files = reader.find_markdown_files()

        if not markdown_files:
            self.console.print("[red]No markdown files found![/red]")
            return QuestionBank()

        self.console.print(f"[blue]Found {len(markdown_files)} markdown files[/blue]")
        self.console.print(f"[blue]Output directory: {output_dir}[/blue]")

        # Create output directory
        ensure_directory(output_dir)

        question_bank = QuestionBank()
        successful_chapters = 0
        total_questions = 0

        for file_path in track(
            markdown_files, description="Processing chapters...", console=self.console
        ):
            try:
                # Parse the chapter
                chapter = reader.parse_file(file_path)
                if not chapter:
                    self.console.print(
                        f"[yellow]⚠️  Skipping {file_path.name} - insufficient content[/yellow]"
                    )
                    continue

                self.console.print(f"[cyan]Processing: {chapter.title}[/cyan]")

                # Generate questions for this chapter
                questions = self.openai_client.generate_questions(
                    chapter=chapter,
                    num_questions=self.questions_per_chapter,
                    num_incorrect_answers=self.incorrect_answers_per_question,
                )

                if questions:
                    # Create individual question bank for this chapter
                    chapter_question_bank = QuestionBank(questions=questions)
                    chapter_question_bank.metadata = {
                        "chapter_number": chapter.chapter_number,
                        "chapter_title": chapter.title,
                        "total_questions": len(questions),
                        "questions_per_chapter": self.questions_per_chapter,
                        "incorrect_answers_per_question": self.incorrect_answers_per_question,
                        "source_file": str(file_path),
                        "generated_at": datetime.now().isoformat(),
                    }

                    # Generate filename based on chapter
                    safe_chapter_name = chapter.chapter_number.replace(".", "_")
                    safe_title = "".join(
                        c for c in chapter.title if c.isalnum() or c in (" ", "-", "_")
                    ).rstrip()
                    safe_title = safe_title.replace(" ", "_")

                    output_filename = f"{safe_chapter_name}_{safe_title}.json"
                    output_file = output_dir / output_filename

                    # Save individual file
                    self.save_question_bank(chapter_question_bank, output_file)

                    # Add to overall bank for statistics
                    for question in questions:
                        question_bank.add_question(question)

                    successful_chapters += 1
                    total_questions += len(questions)
                    self.console.print(
                        f"[green]✓[/green] Generated {len(questions)} questions from {chapter.title}"
                    )
                else:
                    self.console.print(
                        f"[red]❌ Failed to generate questions from {chapter.title}[/red]"
                    )

            except Exception as e:
                self.console.print(f"[red]❌ Error processing {file_path.name}: {e}[/red]")
                continue

        # Add metadata to overall bank
        question_bank.metadata = {
            "total_questions": total_questions,
            "chapters_processed": successful_chapters,
            "questions_per_chapter": self.questions_per_chapter,
            "incorrect_answers_per_question": self.incorrect_answers_per_question,
            "source_directory": str(markdown_dir),
            "output_directory": str(output_dir),
            "generated_at": datetime.now().isoformat(),
            "output_format": "separate_files",
        }

        self.console.print("\n[bold green]Generation complete![/bold green]")
        self.console.print(f"Successfully processed {successful_chapters} chapters")
        self.console.print(f"Generated {total_questions} total questions")
        self.console.print(f"Created {successful_chapters} individual JSON files in {output_dir}")

        return question_bank

    def generate_from_single_file(
        self, markdown_file: Path, output_file: Path | None = None
    ) -> list[Question]:
        """Generate questions from a single markdown file."""
        self.console.print(f"[green]Processing single file: {markdown_file}[/green]")

        reader = MarkdownReader(markdown_file.parent)
        chapter = reader.parse_file(markdown_file)

        if not chapter:
            self.console.print("[red]Failed to parse markdown file![/red]")
            return []

        self.console.print(f"[cyan]Generating questions for: {chapter.title}[/cyan]")

        questions = self.openai_client.generate_questions(
            chapter=chapter,
            num_questions=self.questions_per_chapter,
            num_incorrect_answers=self.incorrect_answers_per_question,
        )

        if questions:
            self.console.print(f"[green]✓ Generated {len(questions)} questions[/green]")

            if output_file:
                question_bank = QuestionBank(questions=questions)
                question_bank.metadata = {
                    "total_questions": len(questions),
                    "source_file": str(markdown_file),
                    "chapter_title": chapter.title,
                    "generated_at": datetime.now().isoformat(),
                }
                self.save_question_bank(question_bank, output_file)
        else:
            self.console.print("[red]❌ Failed to generate questions[/red]")

        return questions

    def save_question_bank(self, question_bank: QuestionBank, output_file: Path) -> None:
        """Save question bank to JSON file."""
        # Update timestamp if not set
        if "generated_at" not in question_bank.metadata:
            question_bank.metadata["generated_at"] = datetime.now().isoformat()

        # Convert to dict format compatible with the app
        output_data = self._format_for_app(question_bank)

        ensure_directory(output_file.parent)

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)

        self.console.print(f"[green]💾 Saved questions to: {output_file}[/green]")

    def _format_for_app(self, question_bank: QuestionBank) -> dict[str, Any]:
        """Format question bank for the React Native app to match existing format."""
        import random

        formatted_questions = []

        for i, question in enumerate(question_bank.questions):
            # Shuffle answers (correct answer shouldn't always be first)
            shuffled_answers = question.answers.copy()
            random.shuffle(shuffled_answers)

            # Find correct answer index after shuffling
            correct_answer_index = next(
                i for i, answer in enumerate(shuffled_answers) if answer.is_correct
            )

            formatted_question = {
                "id": question.id or str(uuid.uuid4()),
                "question": question.question,
                "options": [
                    answer.text for answer in shuffled_answers
                ],  # Use 'options' to match app
                "correctAnswer": correct_answer_index,
                "explanation": question.explanation
                or f"Riktig svar er basert på {question.category or 'teoripensum'}.",
                "category": question.category or "General",
                "difficulty": question.difficulty or "medium",
                "imageUrl": question.image_url,
                "signId": question.sign_id,
            }
            formatted_questions.append(formatted_question)

        return {
            "questions": formatted_questions  # Match the app's top-level structure
        }

    def get_statistics(self, question_bank: QuestionBank) -> dict[str, Any]:
        """Get statistics about the question bank."""
        categories = {}
        chapters = {}
        difficulties = {}

        for question in question_bank.questions:
            # Count by category
            cat = question.category or "Unknown"
            categories[cat] = categories.get(cat, 0) + 1

            # Count by chapter
            chap = question.chapter or "Unknown"
            chapters[chap] = chapters.get(chap, 0) + 1

            # Count by difficulty
            diff = question.difficulty or "Unknown"
            difficulties[diff] = difficulties.get(diff, 0) + 1

        return {
            "total_questions": len(question_bank.questions),
            "categories": categories,
            "chapters": chapters,
            "difficulties": difficulties,
            "avg_answers_per_question": sum(len(q.answers) for q in question_bank.questions)
            / len(question_bank.questions)
            if question_bank.questions
            else 0,
        }
