"""Road signs question generator using OpenAI Vision."""

import base64
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Any

import requests
from rich.console import Console
from rich.progress import Progress, track

from ..utils.console import get_console
from ..utils.file_utils import ensure_directory
from .models import Question, QuestionBank
from .openai_client import QuestionGeneratorClient


class RoadSignsQuestionGenerator:
    """Generate quiz questions for road signs using OpenAI Vision."""

    def __init__(
        self,
        openai_api_key: str | None = None,
        openai_api_base: str | None = None,
        model: str = "espen-gpt-4.1",
        incorrect_answers_per_question: int = 20,
        console: Console | None = None,
    ):
        """Initialize the road signs question generator.

        Args:
            openai_api_key: OpenAI API key
            openai_api_base: OpenAI API base URL
            model: Model to use for vision tasks
            incorrect_answers_per_question: Number of incorrect answers per question
            console: Optional Rich console for output
        """
        self.openai_client = QuestionGeneratorClient(
            api_key=openai_api_key, api_base=openai_api_base, model=model
        )
        self.incorrect_answers_per_question = incorrect_answers_per_question
        self.console = console or get_console()

    def generate_from_signs_data(
        self,
        signs_file: Path,
        output_file: Path | None = None,
        max_signs: int | None = None,
        categories: list[str] | None = None,
        require_descriptions: bool = True,
    ) -> QuestionBank:
        """Generate questions from road signs JSON data."""
        self.console.print(f"[green]📖 Reading road signs data from: {signs_file}[/green]")

        # Load signs data
        try:
            with open(signs_file, encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            self.console.print(f"[red]❌ Error reading signs file: {e}[/red]")
            return QuestionBank()

        signs = data.get("signs", [])
        if not signs:
            self.console.print("[red]❌ No signs found in file![/red]")
            return QuestionBank()

        # Filter by categories if specified
        if categories:
            signs = [
                sign
                for sign in signs
                if sign.get("category", "").lower() in [c.lower() for c in categories]
            ]
            self.console.print(
                f"[blue]Filtered to {len(signs)} signs in categories: {', '.join(categories)}[/blue]"
            )

        # Filter by description requirement for pedagogical accuracy
        if require_descriptions:
            signs_with_desc = []
            for sign in signs:
                # Try to extract actual description from the sign data
                actual_desc = self._get_actual_description(sign)
                if actual_desc and len(actual_desc.strip()) >= 20:
                    signs_with_desc.append(sign)

            skipped = len(signs) - len(signs_with_desc)
            signs = signs_with_desc
            if skipped > 0:
                self.console.print(
                    f"[yellow]Skipped {skipped} signs without sufficient descriptions (require_descriptions=True)[/yellow]"
                )

        # Limit number of signs if specified
        if max_signs and len(signs) > max_signs:
            signs = signs[:max_signs]
            self.console.print(f"[blue]Limited to first {max_signs} signs[/blue]")

        self.console.print(f"[blue]Processing {len(signs)} road signs...[/blue]")

        question_bank = QuestionBank()
        successful_questions = 0

        for sign_data in track(signs, description="Generating questions...", console=self.console):
            try:
                question = self._generate_question_for_sign(sign_data, require_descriptions)
                if question:
                    question_bank.add_question(question)
                    successful_questions += 1
                    self.console.print(
                        f"[green]✓[/green] Generated question for sign {sign_data.get('id', 'unknown')}"
                    )
                else:
                    self.console.print(
                        f"[red]❌[/red] Failed to generate question for sign {sign_data.get('id', 'unknown')}"
                    )

            except Exception as e:
                self.console.print(
                    f"[red]❌ Error processing sign {sign_data.get('id', 'unknown')}: {e}[/red]"
                )
                continue

        # Add metadata
        question_bank.metadata = {
            "total_questions": successful_questions,
            "signs_processed": len(signs),
            "source_file": str(signs_file),
            "question_type": "road_signs_visual",
            "incorrect_answers_per_question": self.incorrect_answers_per_question,
            "generated_at": datetime.now().isoformat(),
        }

        self.console.print("\n[bold green]✅ Question generation complete![/bold green]")
        self.console.print(
            f"Successfully generated {successful_questions} questions from {len(signs)} signs"
        )

        # Save if output file specified
        if output_file:
            self._save_question_bank(question_bank, output_file)

        return question_bank

    def generate_from_signs_data_separate(
        self,
        signs_file: Path,
        output_dir: Path,
        max_signs: int | None = None,
        categories: list[str] | None = None,
        require_descriptions: bool = True,
        skip_existing: bool = False,
        concurrency: int = 3,
    ) -> QuestionBank:
        """Generate questions from road signs JSON data, creating separate files for each sign."""
        self.console.print(f"[green]📖 Reading road signs data from: {signs_file}[/green]")

        # Load signs data
        try:
            with open(signs_file, encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            self.console.print(f"[red]❌ Error reading signs file: {e}[/red]")
            return QuestionBank()

        signs = data.get("signs", [])
        if not signs:
            self.console.print("[red]❌ No signs found in file![/red]")
            return QuestionBank()

        # Filter by categories if specified
        if categories:
            signs = [
                sign
                for sign in signs
                if sign.get("category", "").lower() in [c.lower() for c in categories]
            ]
            self.console.print(
                f"[blue]Filtered to {len(signs)} signs in categories: {', '.join(categories)}[/blue]"
            )

        # Filter by description requirement for pedagogical accuracy
        if require_descriptions:
            signs_with_desc = []
            for sign in signs:
                # Try to extract actual description from the sign data
                actual_desc = self._get_actual_description(sign)
                if actual_desc and len(actual_desc.strip()) >= 20:
                    signs_with_desc.append(sign)

            skipped = len(signs) - len(signs_with_desc)
            signs = signs_with_desc
            if skipped > 0:
                self.console.print(
                    f"[yellow]Skipped {skipped} signs without sufficient descriptions (require_descriptions=True)[/yellow]"
                )

        # Filter out existing files if skip_existing is enabled
        if skip_existing:
            # Create output directory first to check for existing files
            ensure_directory(output_dir)

            signs_to_process = []
            skipped_existing = 0
            skipped_details = []
            
            # Debug: count actual files
            actual_files = list(output_dir.glob("sign_*.json"))
            self.console.print(f"[dim]Debug: Found {len(actual_files)} existing files in output directory[/dim]")

            for sign in signs:
                sign_id = sign.get("id", "unknown")
                sign_name = sign.get("name", "Unknown sign")
                
                # Check for the exact filename only
                safe_filename = self._create_safe_filename(sign_id, sign_name)
                output_file = output_dir / f"{safe_filename}.json"
                
                # Skip only if the exact file already exists
                # This allows multiple signs with the same ID but different names
                if output_file.exists():
                    skipped_existing += 1
                    skipped_details.append(f"{sign_id}: {sign_name} -> {safe_filename}.json")
                else:
                    signs_to_process.append(sign)

            signs = signs_to_process
            if skipped_existing > 0:
                self.console.print(
                    f"[yellow]Skipped {skipped_existing} signs with existing JSON files (skip_existing=True)[/yellow]"
                )
                # Optionally show first few skipped signs for debugging
                if skipped_existing <= 10:
                    for detail in skipped_details:
                        self.console.print(f"[dim]  - {detail}[/dim]")
                elif skipped_existing > 10:
                    for detail in skipped_details[:5]:
                        self.console.print(f"[dim]  - {detail}[/dim]")
                    self.console.print(f"[dim]  ... and {skipped_existing - 5} more[/dim]")

        # Limit number of signs if specified
        if max_signs and len(signs) > max_signs:
            signs = signs[:max_signs]
            self.console.print(f"[blue]Limited to first {max_signs} signs[/blue]")

        self.console.print(f"[blue]Processing {len(signs)} road signs...[/blue]")

        # Create output directory
        if not skip_existing:  # Only create if not already created above
            ensure_directory(output_dir)

        question_bank = QuestionBank()
        successful_questions = 0

        # Use thread-safe lock for shared resources
        lock = Lock()

        def process_sign(sign_data: dict[str, Any]) -> dict[str, Any] | None:
            """Process a single sign - this function will run in parallel."""
            try:
                question = self._generate_question_for_sign(sign_data, require_descriptions)
                if question:
                    # Create individual question bank for this sign
                    individual_bank = QuestionBank()
                    individual_bank.add_question(question)

                    # Set metadata for individual file
                    sign_id = sign_data.get("id", "unknown")
                    sign_name = sign_data.get("name", "Unknown sign")
                    individual_bank.metadata = {
                        "total_questions": 1,
                        "sign_id": sign_id,
                        "sign_name": sign_name,
                        "sign_category": sign_data.get("category", "Unknown"),
                        "source_file": str(signs_file),
                        "question_type": "road_signs_visual",
                        "incorrect_answers_per_question": self.incorrect_answers_per_question,
                        "generated_at": datetime.now().isoformat(),
                    }

                    # Save individual file
                    safe_filename = self._create_safe_filename(sign_id, sign_name)
                    output_file = output_dir / f"{safe_filename}.json"
                    self._save_question_bank(individual_bank, output_file)

                    return {
                        "success": True,
                        "question": question,
                        "sign_id": sign_id,
                        "filename": f"{safe_filename}.json",
                    }
                else:
                    return {
                        "success": False,
                        "sign_id": sign_data.get("id", "unknown"),
                        "error": "Failed to generate question",
                    }

            except Exception as e:
                return {
                    "success": False,
                    "sign_id": sign_data.get("id", "unknown"),
                    "error": str(e),
                }

        # Process signs in parallel
        with Progress(console=self.console) as progress:
            task = progress.add_task("[cyan]Generating questions...", total=len(signs))

            with ThreadPoolExecutor(max_workers=concurrency) as executor:
                # Submit all tasks
                future_to_sign = {
                    executor.submit(process_sign, sign_data): sign_data for sign_data in signs
                }

                # Process completed tasks
                for future in as_completed(future_to_sign):
                    result = future.result()

                    if result["success"]:
                        with lock:
                            question_bank.add_question(result["question"])
                            successful_questions += 1
                        self.console.print(
                            f"[green]✓[/green] Generated question for sign {result['sign_id']} → {result['filename']}"
                        )
                    else:
                        self.console.print(
                            f"[red]❌[/red] Failed to generate question for sign {result['sign_id']}: {result['error']}"
                        )

                    progress.update(task, advance=1)

        # Add metadata for combined result
        question_bank.metadata = {
            "total_questions": successful_questions,
            "signs_processed": len(signs),
            "source_file": str(signs_file),
            "question_type": "road_signs_visual",
            "incorrect_answers_per_question": self.incorrect_answers_per_question,
            "generated_at": datetime.now().isoformat(),
        }

        self.console.print("\n[bold green]✅ Question generation complete![/bold green]")
        self.console.print(
            f"Successfully generated {successful_questions} questions from {len(signs)} signs"
        )
        self.console.print(f"Individual files saved to: {output_dir}")

        return question_bank

    def _normalize_sign_name(self, sign_name: str) -> str:
        """Normalize sign name for comparison purposes."""
        import re
        
        # Keep the original structure but normalize for comparison
        # This preserves the sign number as part of the identity
        normalized = sign_name.lower()
        
        # Remove special characters but keep numbers and letters
        normalized = re.sub(r"[^\w\s-]", "", normalized)
        normalized = re.sub(r"\s+", " ", normalized).strip()
        
        # Don't extract parts - keep the full normalized name
        # This ensures "100 Farlig sving" is different from "1000 Kjørefeltlinje"
        return normalized

    def _create_safe_filename(self, sign_id: str, sign_name: str) -> str:
        """Create a safe filename for the sign."""
        import re

        # Extract just the basic name part (before any description)
        clean_name = sign_name

        # Try to get just the number and basic name
        match = re.match(
            r"^(\d+(?:\.\d+)?\s+[A-ZÆØÅ][a-zæøåA-ZÆØÅ\s]*?)([A-ZÆØÅ][a-zæøå].*|$)", sign_name
        )
        if match:
            clean_name = match.group(1).strip()

        # Fallback: use first 30 characters
        if len(clean_name) > 30:
            clean_name = clean_name[:30].strip()

        # Create safe filename: sign_id + clean name
        safe_name = re.sub(r"[^\w\s-]", "", clean_name)
        safe_name = re.sub(r"[-\s]+", "_", safe_name)

        return f"sign_{sign_id}_{safe_name}"

    def _generate_question_for_sign(
        self, sign_data: dict[str, Any], require_descriptions: bool = True
    ) -> Question | None:
        """Generate a single question for a road sign."""
        sign_id = sign_data.get("id", "unknown")
        sign_name = sign_data.get("name", "Unknown sign")
        sign_category = sign_data.get("category", "Road signs")
        sign_description = sign_data.get("description", "")
        image_url = sign_data.get("image_url")
        image_file = sign_data.get("image_file")
        lovdata_reference = sign_data.get("lovdata_reference", "")

        # Get the actual description (improved scraper should have separated this properly)
        actual_description = self._get_actual_description(sign_data)

        if not image_url and not image_file:
            self.console.print(f"[yellow]⚠️ No image available for sign {sign_id}[/yellow]")
            return None

        # Skip signs without proper descriptions as they won't generate good pedagogical questions
        if require_descriptions and (
            not actual_description or len(actual_description.strip()) < 20
        ):
            self.console.print(
                f"[yellow]⚠️ Insufficient description for sign {sign_id} - skipping for pedagogical accuracy[/yellow]"
            )
            return None

        try:
            # Get image data
            image_data = self._get_image_data(image_url, image_file)
            if not image_data:
                return None

            # Generate question using OpenAI Vision
            questions = self.openai_client.generate_road_sign_questions(
                sign_id=sign_id,
                sign_name=sign_name,
                sign_description=actual_description,
                image_base64=image_data,
                num_questions=1,
                num_incorrect_answers=self.incorrect_answers_per_question,
                question_id_prefix=f"sign_{sign_id}",
            )

            if not questions:
                return None

            question = questions[0]

            # Add additional metadata
            question.category = sign_category
            question.chapter = f"road_signs_{sign_category.lower()}"
            question.source_text = f"Road sign {sign_id}: {sign_name} - {actual_description[:100] if actual_description else 'No description'}"
            question.image_url = image_url

            return question

        except Exception as e:
            self.console.print(
                f"[yellow]⚠️ Error generating question for sign {sign_id}: {e}[/yellow]"
            )
            return None

    def _get_image_data(self, image_url: str | None, image_file: str | None) -> str | None:
        """Get base64 encoded image data from URL or file."""
        try:
            if image_file and Path(image_file).exists():
                # Read from local file
                with open(image_file, "rb") as f:
                    image_bytes = f.read()
            elif image_url:
                # Download from URL
                response = requests.get(image_url, timeout=10)
                response.raise_for_status()
                image_bytes = response.content
            else:
                return None

            # Convert to base64
            return base64.b64encode(image_bytes).decode("utf-8")

        except Exception as e:
            self.console.print(f"[yellow]⚠️ Error getting image data: {e}[/yellow]")
            return None

    def _save_question_bank(self, question_bank: QuestionBank, output_file: Path) -> None:
        """Save question bank to JSON file."""
        from .generator import QuestionGenerator

        # Update timestamp
        if "generated_at" not in question_bank.metadata:
            question_bank.metadata["generated_at"] = datetime.now().isoformat()

        # Use the existing format method from QuestionGenerator
        generator = QuestionGenerator(console=self.console)
        output_data = generator._format_for_app(question_bank)

        ensure_directory(output_file.parent)

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)

        self.console.print(
            f"[green]💾 Saved {len(question_bank.questions)} road sign questions to: {output_file}[/green]"
        )

    def _get_actual_description(self, sign_data: dict[str, Any]) -> str:
        """Get the actual description from sign data, preferring description field but falling back to name parsing."""
        description = sign_data.get("description") or ""
        description = description.strip() if description else ""

        # If we have a good description in the description field, use it
        if description and len(description) >= 20 and description != ".":
            return description

        # Otherwise, the scraper should have properly separated name and description
        # If not, we may have the old format where description is in the name
        name = sign_data.get("name") or ""
        name = name.strip() if name else ""

        if not name:
            return ""

        # If the name is very long, it might contain the description too
        if len(name) > 50:
            # Try to extract description from name using similar logic as the scraper
            import re

            # Look for patterns where the description starts
            sentence_starters = [
                r"Skiltet\s+(?:angir|varsler)",
                r"Forbudet\s+gjelder",
                r"Påbudet\s+gjelder",
            ]

            for starter_pattern in sentence_starters:
                match = re.search(starter_pattern, name, re.IGNORECASE)
                if match:
                    potential_desc = name[match.start() :].strip()
                    if len(potential_desc) >= 20:
                        return potential_desc

            # Try basic pattern: find where description likely starts after the name
            # Pattern: number + basic name + description
            pattern = r"^(\d+(?:\.\d+)?\s+[A-ZÆØÅ][a-zæøåA-ZÆØÅ\s]*?)([A-ZÆØÅ][a-zæøå].*)"
            match = re.match(pattern, name)
            if match and match.group(2):
                potential_desc = match.group(2).strip()
                if len(potential_desc) >= 20:
                    return potential_desc

        # Return the description field even if it's short/empty
        return description

    def get_statistics(self, question_bank: QuestionBank) -> dict[str, Any]:
        """Get statistics about the road signs question bank."""
        categories = {}
        difficulties = {}

        for question in question_bank.questions:
            # Count by category
            cat = question.category or "Unknown"
            categories[cat] = categories.get(cat, 0) + 1

            # Count by difficulty
            diff = question.difficulty or "Unknown"
            difficulties[diff] = difficulties.get(diff, 0) + 1

        return {
            "total_questions": len(question_bank.questions),
            "categories": categories,
            "difficulties": difficulties,
            "avg_answers_per_question": sum(len(q.answers) for q in question_bank.questions)
            / len(question_bank.questions)
            if question_bank.questions
            else 0,
            "question_type": "road_signs_visual",
        }
