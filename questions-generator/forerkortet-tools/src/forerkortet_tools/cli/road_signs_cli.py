"""CLI commands for road signs scraping."""

import json
from pathlib import Path

import click
from rich.table import Table

from ..road_signs import RoadSignsScraper
from ..utils.console import get_console

console = get_console()


@click.group(name="road-signs")
def road_signs():
    """Scrape Norwegian road signs data from official sources."""
    pass


@road_signs.command()
@click.option(
    "--output",
    "-o",
    type=click.Path(file_okay=True, dir_okay=False, path_type=Path),
    default="road_signs_data.json",
    help="Output JSON file for scraped data",
)
@click.option("--download-images/--no-download-images", default=False, help="Download sign images")
@click.option(
    "--images-dir",
    "-i",
    type=click.Path(file_okay=False, dir_okay=True, path_type=Path),
    default="road_signs_images",
    help="Directory to save downloaded images",
)
@click.option("--delay", "-d", type=float, default=1.0, help="Delay between requests in seconds")
def scrape(output: Path, download_images: bool, images_dir: Path, delay: float):
    """Scrape all road signs from Vegvesen and Lovdata."""
    console.print("[bold blue]Norwegian Road Signs Scraper[/bold blue]\n")

    scraper = RoadSignsScraper(delay=delay, console=console)
    session = scraper.scrape_all(download_images=download_images, images_dir=images_dir)

    # Save to JSON
    console.print(f"\n[blue]💾 Saving data to {output}...[/blue]")

    with open(output, "w", encoding="utf-8") as f:
        json.dump(session.to_export_dict(), f, ensure_ascii=False, indent=2)

    console.print(f"[green]✓ Data saved to {output}[/green]")

    # Show summary
    console.print("\n[bold]Summary:[/bold]")
    console.print(f"Total unique signs: {len(session.signs)}")
    console.print(f"Duplicates prevented: {session.duplicate_count}")
    console.print(f"Categories: {', '.join(session.get_categories())}")


@road_signs.command()
@click.option("--url", "-u", required=True, help="URL to scrape (Lovdata page)")
@click.option("--category", "-c", default="Unknown", help="Category name for the signs")
@click.option(
    "--output",
    "-o",
    type=click.Path(file_okay=True, dir_okay=False, path_type=Path),
    help="Output JSON file (optional)",
)
def scrape_url(url: str, category: str, output: Path | None):
    """Scrape a specific Lovdata URL."""
    console.print(f"[bold blue]Scraping {url}[/bold blue]\n")

    scraper = RoadSignsScraper(console=console)
    signs = scraper._scrape_lovdata_page(url, category)

    console.print(f"\n[green]Found {len(signs)} signs[/green]")

    # Display signs
    table = Table(title="Scraped Signs")
    table.add_column("ID", style="cyan")
    table.add_column("Name", style="green")
    table.add_column("Category", style="yellow")
    table.add_column("Has Image", style="blue")

    for sign in signs:
        table.add_row(
            sign.id,
            sign.name[:50] + "..." if len(sign.name) > 50 else sign.name,
            sign.category,
            "✓" if sign.image_url else "✗",
        )

    console.print(table)

    # Save if output specified
    if output:
        data = {"signs": [sign.model_dump() for sign in signs]}
        with open(output, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        console.print(f"\n[green]✓ Data saved to {output}[/green]")


@road_signs.command()
def list_links():
    """List all Lovdata links found on Vegvesen page."""
    console.print("[bold blue]Finding Lovdata links from Vegvesen...[/bold blue]\n")

    scraper = RoadSignsScraper(console=console)
    links = scraper._get_lovdata_links_from_vegvesen()

    if not links:
        console.print("[red]No links found![/red]")
        return

    table = Table(title="Lovdata Links")
    table.add_column("#", style="cyan", width=4)
    table.add_column("Title", style="green")
    table.add_column("Category", style="yellow")
    table.add_column("URL", style="blue")

    for i, link in enumerate(links, 1):
        table.add_row(
            str(i),
            link["title"][:40] + "..." if len(link["title"]) > 40 else link["title"],
            link["category"],
            link["url"][:60] + "..." if len(link["url"]) > 60 else link["url"],
        )

    console.print(table)
    console.print(f"\n[green]Total links: {len(links)}[/green]")


@road_signs.command()
@click.option(
    "--file",
    "-f",
    type=click.Path(exists=True, file_okay=True, dir_okay=False, path_type=Path),
    required=True,
    help="JSON file with scraped data",
)
def stats(file: Path):
    """Show statistics from scraped data file."""
    with open(file, encoding="utf-8") as f:
        data = json.load(f)

    signs = data.get("signs", [])
    metadata = data.get("metadata", {})

    console.print("[bold blue]Road Signs Data Statistics[/bold blue]\n")

    # General stats
    console.print(f"[green]Total signs:[/green] {len(signs)}")
    console.print(f"[green]Scraped at:[/green] {metadata.get('scraped_at', 'Unknown')}")
    console.print(f"[green]Source:[/green] {metadata.get('source', 'Unknown')}")

    # Category breakdown
    categories = {}
    for sign in signs:
        cat = sign.get("category", "Unknown")
        categories[cat] = categories.get(cat, 0) + 1

    console.print("\n[bold]Signs by category:[/bold]")
    table = Table()
    table.add_column("Category", style="cyan")
    table.add_column("Count", style="green", justify="right")
    table.add_column("Percentage", style="yellow", justify="right")

    for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(signs)) * 100 if signs else 0
        table.add_row(cat, str(count), f"{percentage:.1f}%")

    console.print(table)

    # Additional stats
    with_images = sum(1 for s in signs if s.get("image_url"))
    with_descriptions = sum(1 for s in signs if s.get("description"))
    with_legal_ref = sum(1 for s in signs if s.get("lovdata_reference"))

    console.print("\n[bold]Additional statistics:[/bold]")
    console.print(f"Signs with images: {with_images} ({with_images / len(signs) * 100:.1f}%)")
    console.print(
        f"Signs with descriptions: {with_descriptions} ({with_descriptions / len(signs) * 100:.1f}%)"
    )
    console.print(
        f"Signs with legal references: {with_legal_ref} ({with_legal_ref / len(signs) * 100:.1f}%)"
    )
