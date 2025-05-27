"""Main CLI entry point for Forerkortet Tools."""

import click
from pathlib import Path
from rich.console import Console

from ..utils.console import get_console
from .html_converter_cli import html_to_markdown
from .road_signs_cli import road_signs
from .question_generator_cli import questions

console = get_console()


@click.group()
@click.version_option(version="0.1.0", prog_name="forerkortet-tools")
def main():
    """Forerkortet Tools - Comprehensive toolkit for Norwegian driving license quiz generation.
    
    This tool consolidates:
    - HTML to Markdown conversion for theory books
    - Road signs data scraping
    - AI-powered question generation
    """
    pass


# Register sub-commands
main.add_command(html_to_markdown)
main.add_command(road_signs)
main.add_command(questions)


if __name__ == "__main__":
    main()