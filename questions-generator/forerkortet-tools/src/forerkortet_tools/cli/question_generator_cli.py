"""CLI commands for question generation."""

import json
from pathlib import Path

import click
from dotenv import load_dotenv
from rich.table import Table

from ..question_generator import QuestionGenerator, RoadSignsQuestionGenerator
from ..utils.console import get_console

load_dotenv()

console = get_console()


@click.group(name="questions")
def questions():
    """Generate quiz questions using AI from theory content and road signs."""
    pass


@questions.command()
@click.option(
    "--markdown-dir",
    "-i",
    type=click.Path(exists=True, file_okay=False, dir_okay=True, path_type=Path),
    default="questions-generator/theory-book-markdown",
    help="Directory containing markdown files",
)
@click.option(
    "--output",
    "-o",
    type=click.Path(file_okay=True, dir_okay=False, path_type=Path),
    default="questions.json",
    help="Output JSON file for questions",
)
@click.option(
    "--questions-per-chapter",
    "-q",
    type=int,
    default=5,
    help="Number of questions to generate per chapter",
)
@click.option(
    "--incorrect-answers",
    "-a",
    type=int,
    default=20,
    help="Number of incorrect answers per question",
)
@click.option("--api-key", envvar="OPENAI_API_KEY", help="OpenAI API key")
@click.option("--api-base", help="OpenAI API base URL")
@click.option("--model", default="gpt-4", help="Model to use for generation")
def batch(
    markdown_dir: Path,
    output: Path,
    questions_per_chapter: int,
    incorrect_answers: int,
    api_key: str,
    api_base: str,
    model: str,
):
    """Generate questions from all markdown files in a directory."""
    console.print("[bold blue]Question Generator - Batch Mode[/bold blue]\n")

    generator = QuestionGenerator(
        openai_api_key=api_key,
        openai_api_base=api_base,
        model=model,
        questions_per_chapter=questions_per_chapter,
        incorrect_answers_per_question=incorrect_answers,
        console=console,
    )

    question_bank = generator.generate_from_directory(markdown_dir, output)

    # Show statistics
    if question_bank.questions:
        stats = generator.get_statistics(question_bank)
        _display_statistics(stats)


@questions.command()
@click.option(
    "--markdown-dir",
    "-i",
    type=click.Path(exists=True, file_okay=False, dir_okay=True, path_type=Path),
    default="questions-generator/theory-book-markdown",
    help="Directory containing markdown files",
)
@click.option(
    "--output-dir",
    "-o",
    type=click.Path(file_okay=False, dir_okay=True, path_type=Path),
    default="comprehensive_questions_separate",
    help="Output directory for individual JSON files",
)
@click.option(
    "--questions-per-chapter",
    "-q",
    type=int,
    default=5,
    help="Number of questions to generate per chapter",
)
@click.option(
    "--incorrect-answers",
    "-a",
    type=int,
    default=20,
    help="Number of incorrect answers per question",
)
@click.option("--api-key", envvar="OPENAI_API_KEY", help="OpenAI API key")
@click.option("--api-base", help="OpenAI API base URL")
@click.option("--model", default="gpt-4", help="Model to use for generation")
def batch_separate(
    markdown_dir: Path,
    output_dir: Path,
    questions_per_chapter: int,
    incorrect_answers: int,
    api_key: str,
    api_base: str,
    model: str,
):
    """Generate questions from markdown files, creating separate JSON files per chapter."""
    console.print("[bold blue]Question Generator - Separate Files Mode[/bold blue]\n")

    generator = QuestionGenerator(
        openai_api_key=api_key,
        openai_api_base=api_base,
        model=model,
        questions_per_chapter=questions_per_chapter,
        incorrect_answers_per_question=incorrect_answers,
        console=console,
    )

    question_bank = generator.generate_from_directory_separate(markdown_dir, output_dir)

    # Show statistics
    if question_bank.questions:
        stats = generator.get_statistics(question_bank)
        _display_statistics(stats)


@questions.command()
@click.option(
    "--file",
    "-f",
    type=click.Path(exists=True, file_okay=True, dir_okay=False, path_type=Path),
    required=True,
    help="Single markdown file to process",
)
@click.option(
    "--output",
    "-o",
    type=click.Path(file_okay=True, dir_okay=False, path_type=Path),
    help="Output JSON file",
)
@click.option("--questions", "-q", type=int, default=5, help="Number of questions to generate")
@click.option(
    "--incorrect-answers",
    "-a",
    type=int,
    default=20,
    help="Number of incorrect answers per question",
)
@click.option("--api-key", envvar="OPENAI_API_KEY", help="OpenAI API key")
@click.option("--api-base", help="OpenAI API base URL")
@click.option("--model", default="gpt-4", help="Model to use for generation")
def single(
    file: Path,
    output: Path,
    questions: int,
    incorrect_answers: int,
    api_key: str,
    api_base: str,
    model: str,
):
    """Generate questions from a single markdown file."""
    console.print("[bold blue]Question Generator - Single File Mode[/bold blue]\n")

    generator = QuestionGenerator(
        openai_api_key=api_key,
        openai_api_base=api_base,
        model=model,
        questions_per_chapter=questions,
        incorrect_answers_per_question=incorrect_answers,
        console=console,
    )

    questions_list = generator.generate_from_single_file(file, output)

    if questions_list:
        console.print(f"\n[green]Generated {len(questions_list)} questions[/green]")


@questions.command()
@click.option(
    "--signs-file",
    "-s",
    type=click.Path(exists=True, file_okay=True, dir_okay=False, path_type=Path),
    default="road_signs_data.json",
    help="JSON file with road signs data",
)
@click.option(
    "--output",
    "-o",
    type=click.Path(file_okay=True, dir_okay=False, path_type=Path),
    default="road_signs_questions.json",
    help="Output JSON file for questions",
)
@click.option("--max-signs", "-m", type=int, help="Maximum number of signs to process")
@click.option(
    "--categories", "-c", multiple=True, help="Filter by sign categories (can specify multiple)"
)
@click.option(
    "--incorrect-answers",
    "-a",
    type=int,
    default=20,
    help="Number of incorrect answers per question",
)
@click.option("--api-key", envvar="OPENAI_API_KEY", help="OpenAI API key")
@click.option("--api-base", help="OpenAI API base URL")
@click.option("--model", default="espen-gpt-4.1", help="Model to use for vision tasks")
@click.option("--no-descriptions", is_flag=True, help="Include signs without descriptions")
def road_signs(
    signs_file: Path,
    output: Path,
    max_signs: int,
    categories: tuple,
    incorrect_answers: int,
    api_key: str,
    api_base: str,
    model: str,
    no_descriptions: bool,
):
    """Generate questions from road signs data using vision AI."""
    console.print("[bold blue]Road Signs Question Generator[/bold blue]\n")

    generator = RoadSignsQuestionGenerator(
        openai_api_key=api_key,
        openai_api_base=api_base,
        model=model,
        incorrect_answers_per_question=incorrect_answers,
        console=console,
    )

    question_bank = generator.generate_from_signs_data(
        signs_file=signs_file,
        output_file=output,
        max_signs=max_signs,
        categories=list(categories) if categories else None,
        require_descriptions=not no_descriptions,
    )

    # Show statistics
    if question_bank.questions:
        stats = generator.get_statistics(question_bank)
        _display_statistics(stats)


@questions.command()
@click.option(
    "--signs-file",
    "-s",
    type=click.Path(exists=True, file_okay=True, dir_okay=False, path_type=Path),
    default="road_signs_data.json",
    help="JSON file with road signs data",
)
@click.option(
    "--output-dir",
    "-o",
    type=click.Path(file_okay=False, dir_okay=True, path_type=Path),
    default="road_signs_individual",
    help="Output directory for individual JSON files",
)
@click.option("--max-signs", "-m", type=int, help="Maximum number of signs to process")
@click.option(
    "--categories", "-c", multiple=True, help="Filter by sign categories (can specify multiple)"
)
@click.option(
    "--incorrect-answers",
    "-a",
    type=int,
    default=20,
    help="Number of incorrect answers per question",
)
@click.option("--api-key", envvar="OPENAI_API_KEY", help="OpenAI API key")
@click.option("--api-base", help="OpenAI API base URL")
@click.option("--model", default="espen-gpt-4.1", help="Model to use for vision tasks")
@click.option("--no-descriptions", is_flag=True, help="Include signs without descriptions")
@click.option(
    "--skip-existing", is_flag=True, help="Skip signs that already have generated JSON files"
)
@click.option("--concurrency", "-j", type=int, default=3, help="Number of parallel requests")
def road_signs_separate(
    signs_file: Path,
    output_dir: Path,
    max_signs: int,
    categories: tuple,
    incorrect_answers: int,
    api_key: str,
    api_base: str,
    model: str,
    no_descriptions: bool,
    skip_existing: bool,
    concurrency: int,
):
    """Generate questions from road signs, creating separate files per sign."""
    console.print("[bold blue]Road Signs Question Generator - Separate Files Mode[/bold blue]\n")

    generator = RoadSignsQuestionGenerator(
        openai_api_key=api_key,
        openai_api_base=api_base,
        model=model,
        incorrect_answers_per_question=incorrect_answers,
        console=console,
    )

    question_bank = generator.generate_from_signs_data_separate(
        signs_file=signs_file,
        output_dir=output_dir,
        max_signs=max_signs,
        categories=list(categories) if categories else None,
        require_descriptions=not no_descriptions,
        skip_existing=skip_existing,
        concurrency=concurrency,
    )

    # Show statistics
    if question_bank.questions:
        stats = generator.get_statistics(question_bank)
        _display_statistics(stats)


@questions.command()
@click.option(
    "--markdown-dir",
    "-i",
    type=click.Path(exists=True, file_okay=False, dir_okay=True, path_type=Path),
    default="questions-generator/theory-book-markdown",
    help="Directory containing markdown files",
)
def list_files(markdown_dir: Path):
    """List all markdown files that would be processed."""
    from ..question_generator.markdown_reader import MarkdownReader

    reader = MarkdownReader(markdown_dir)
    files = reader.find_markdown_files()

    console.print(f"[bold]Found {len(files)} markdown files:[/bold]\n")

    table = Table()
    table.add_column("#", style="cyan", width=4)
    table.add_column("Filename", style="green")
    table.add_column("Size", style="yellow", justify="right")

    for i, file in enumerate(files, 1):
        size = file.stat().st_size
        size_str = f"{size / 1024:.1f} KB" if size > 1024 else f"{size} B"
        table.add_row(str(i), file.name, size_str)

    console.print(table)


@questions.command()
@click.option(
    "--file",
    "-f",
    type=click.Path(exists=True, file_okay=True, dir_okay=False, path_type=Path),
    required=True,
    help="JSON file with generated questions",
)
def stats(file: Path):
    """Show statistics for generated questions."""
    with open(file, encoding="utf-8") as f:
        data = json.load(f)

    questions = data.get("questions", [])

    console.print("[bold blue]Question Statistics[/bold blue]\n")
    console.print(f"[green]Total questions:[/green] {len(questions)}")

    if not questions:
        return

    # Category breakdown
    categories = {}
    difficulties = {}
    avg_options = 0

    for q in questions:
        # Categories
        cat = q.get("category", "Unknown")
        categories[cat] = categories.get(cat, 0) + 1

        # Difficulties (if present)
        if "difficulty" in q:
            diff = q["difficulty"]
            difficulties[diff] = difficulties.get(diff, 0) + 1

        # Options count
        avg_options += len(q.get("options", []))

    avg_options = avg_options / len(questions) if questions else 0

    # Display categories
    console.print("\n[bold]Questions by category:[/bold]")
    table = Table()
    table.add_column("Category", style="cyan")
    table.add_column("Count", style="green", justify="right")
    table.add_column("Percentage", style="yellow", justify="right")

    for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(questions)) * 100
        table.add_row(cat, str(count), f"{percentage:.1f}%")

    console.print(table)

    # Display difficulties if present
    if difficulties:
        console.print("\n[bold]Questions by difficulty:[/bold]")
        diff_table = Table()
        diff_table.add_column("Difficulty", style="cyan")
        diff_table.add_column("Count", style="green", justify="right")

        for diff in ["easy", "medium", "hard"]:
            if diff in difficulties:
                diff_table.add_row(diff, str(difficulties[diff]))

        console.print(diff_table)

    console.print(f"\n[green]Average options per question:[/green] {avg_options:.1f}")


def _display_statistics(stats: dict):
    """Display statistics in a formatted table."""
    console.print("\n[bold]Generation Statistics:[/bold]")

    # General stats
    console.print(f"Total questions: {stats['total_questions']}")
    console.print(f"Average answers per question: {stats['avg_answers_per_question']:.1f}")

    # Categories
    if stats.get("categories"):
        console.print("\n[bold]Questions by category:[/bold]")
        cat_table = Table()
        cat_table.add_column("Category", style="cyan")
        cat_table.add_column("Count", style="green", justify="right")

        for cat, count in sorted(stats["categories"].items(), key=lambda x: x[1], reverse=True):
            cat_table.add_row(cat, str(count))

        console.print(cat_table)

    # Difficulties
    if stats.get("difficulties"):
        console.print("\n[bold]Questions by difficulty:[/bold]")
        diff_table = Table()
        diff_table.add_column("Difficulty", style="cyan")
        diff_table.add_column("Count", style="green", justify="right")

        for diff, count in stats["difficulties"].items():
            diff_table.add_row(diff, str(count))

        console.print(diff_table)
