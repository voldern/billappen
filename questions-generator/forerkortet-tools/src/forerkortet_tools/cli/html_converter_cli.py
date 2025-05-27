"""CLI commands for HTML to Markdown conversion."""

import click
from pathlib import Path
from rich.console import Console

from ..html_converter import HTMLToMarkdownConverter
from ..utils.console import get_console

console = get_console()


@click.group(name="html-to-markdown")
def html_to_markdown():
    """Convert HTML theory book chapters to Markdown."""
    pass


@html_to_markdown.command()
@click.option(
    '--html-dir', '-i',
    type=click.Path(exists=True, file_okay=False, dir_okay=True, path_type=Path),
    default="questions-generator/theory-book",
    help="Directory containing HTML files"
)
@click.option(
    '--output-dir', '-o',
    type=click.Path(file_okay=False, dir_okay=True, path_type=Path),
    default="questions-generator/theory-book-markdown",
    help="Output directory for Markdown files"
)
def convert(html_dir: Path, output_dir: Path):
    """Convert all HTML theory book chapters to Markdown."""
    console.print(f"[bold blue]HTML to Markdown Converter[/bold blue]")
    console.print(f"Input: {html_dir}")
    console.print(f"Output: {output_dir}\n")
    
    converter = HTMLToMarkdownConverter(html_dir, output_dir, console)
    converter.convert_all()


@html_to_markdown.command()
@click.option(
    '--html-file', '-f',
    type=click.Path(exists=True, file_okay=True, dir_okay=False, path_type=Path),
    required=True,
    help="Single HTML file to convert"
)
@click.option(
    '--output-dir', '-o',
    type=click.Path(file_okay=False, dir_okay=True, path_type=Path),
    default="questions-generator/theory-book-markdown",
    help="Output directory for Markdown file"
)
def convert_single(html_file: Path, output_dir: Path):
    """Convert a single HTML file to Markdown."""
    console.print(f"[bold blue]Converting single file[/bold blue]")
    console.print(f"Input: {html_file}")
    console.print(f"Output: {output_dir}\n")
    
    converter = HTMLToMarkdownConverter(html_file.parent, output_dir, console)
    output_file = converter.convert_file(html_file)
    
    if output_file:
        console.print(f"\n[green]✓ Converted to: {output_file}[/green]")
    else:
        console.print(f"\n[red]✗ Conversion failed[/red]")


@html_to_markdown.command()
@click.option(
    '--html-dir', '-i',
    type=click.Path(exists=True, file_okay=False, dir_okay=True, path_type=Path),
    default="questions-generator/theory-book",
    help="Directory containing HTML files"
)
def list_files(html_dir: Path):
    """List all HTML files that would be converted."""
    converter = HTMLToMarkdownConverter(html_dir, Path("."), console)
    html_files = converter.find_html_files()
    
    console.print(f"[bold]Found {len(html_files)} HTML files:[/bold]\n")
    
    for i, file in enumerate(html_files, 1):
        console.print(f"{i:3d}. {file.name}")