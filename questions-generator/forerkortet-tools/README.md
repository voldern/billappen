# Forerkortet Tools

Consolidated Python toolkit for generating Norwegian driving license quiz questions. This package combines three main functionalities:

1. **HTML to Markdown Converter** - Converts theory book HTML files to clean Markdown
2. **Road Signs Scraper** - Scrapes Norwegian road signs data from official sources
3. **Question Generator** - Generates quiz questions using AI from theory content and road signs

## Installation

Using `uv` (recommended):

```bash
cd questions-generator/forerkortet-tools
uv pip install -e ".[dev]"
```

Using pip:

```bash
cd questions-generator/forerkortet-tools
pip install -e ".[dev]"
```

## Configuration

Copy `.env.example` to `.env` and configure your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key or Azure OpenAI credentials.

## Usage

The tool provides a unified CLI interface with three main command groups:

### HTML to Markdown Conversion

Convert theory book HTML files to Markdown:

```bash
# Convert all HTML files in a directory
forerkortet html-to-markdown convert -i ../theory-book -o ../theory-book-markdown

# Convert a single file
forerkortet html-to-markdown convert-single -f ../theory-book/1.1.1.html -o ../theory-book-markdown

# List HTML files that would be converted
forerkortet html-to-markdown list-files -i ../theory-book
```

### Road Signs Scraping

Scrape road signs data from Norwegian official sources:

```bash
# Scrape all road signs
forerkortet road-signs scrape -o road_signs_data.json

# Download images as well
forerkortet road-signs scrape -o road_signs_data.json --download-images -i road_signs_images

# Scrape a specific URL
forerkortet road-signs scrape-url -u "https://lovdata.no/..." -c "Fareskilt"

# Show statistics from scraped data
forerkortet road-signs stats -f road_signs_data.json
```

### Question Generation

Generate quiz questions using AI:

#### From Theory Markdown

```bash
# Generate questions from all markdown files (single output file)
forerkortet questions batch -i ../theory-book-markdown -o questions.json

# Generate separate files per chapter
forerkortet questions batch-separate -i ../theory-book-markdown -o comprehensive_questions_separate

# Generate from a single file
forerkortet questions single -f ../theory-book-markdown/1.1.1.md -o chapter1_questions.json
```

#### From Road Signs

```bash
# Generate questions from road signs (single output file)
forerkortet questions road-signs -s road_signs_data.json -o road_signs_questions.json

# Generate separate files per sign
forerkortet questions road-signs-separate -s road_signs_data.json -o road_signs_individual

# Filter by categories
forerkortet questions road-signs -s road_signs_data.json -c Fareskilt -c Forbudsskilt

# Skip existing files when generating separate files
forerkortet questions road-signs-separate -s road_signs_data.json -o road_signs_individual --skip-existing
```

## Command Options

### Common Options

- `-h, --help` - Show help message
- `--api-key` - OpenAI API key (can also use OPENAI_API_KEY env var)
- `--model` - AI model to use (default: gpt-4)

### Question Generation Options

- `-q, --questions-per-chapter` - Number of questions to generate per chapter (default: 5)
- `-a, --incorrect-answers` - Number of incorrect answers per question (default: 20)
- `-m, --max-signs` - Maximum number of signs to process
- `-c, --categories` - Filter by sign categories (can specify multiple)
- `--no-descriptions` - Include signs without descriptions
- `--skip-existing` - Skip signs that already have generated JSON files
- `-j, --concurrency` - Number of parallel requests (default: 3)

## Development

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=forerkortet_tools

# Run specific test file
pytest tests/unit/test_models.py
```

### Code Quality

```bash
# Format code
black src tests

# Lint code
ruff check src tests

# Type checking
mypy src
```

### Project Structure

```
forerkortet-tools/
├── src/
│   └── forerkortet_tools/
│       ├── cli/                  # CLI command definitions
│       ├── html_converter/       # HTML to Markdown conversion
│       ├── road_signs/          # Road signs scraping
│       ├── question_generator/   # AI question generation
│       └── utils/               # Shared utilities
├── tests/
│   ├── unit/                    # Unit tests
│   └── integration/             # Integration tests
├── data/                        # Data directories
│   ├── input/                   # Input files
│   └── output/                  # Generated output
└── pyproject.toml              # Project configuration
```

## Output Format

### Question JSON Format

Generated questions follow this format:

```json
{
  "questions": [
    {
      "id": "unique-id",
      "question": "Spørsmålstekst på norsk?",
      "options": [
        "Svaralternativ 1",
        "Svaralternativ 2",
        "Svaralternativ 3",
        "Svaralternativ 4"
      ],
      "correctAnswer": 0,
      "explanation": "Forklaring på riktig svar",
      "category": "Trafikkregler"
    }
  ]
}
```

### Road Signs Data Format

Scraped road signs data format:

```json
{
  "signs": [
    {
      "id": "100",
      "name": "Farlig sving",
      "category": "Fareskilt",
      "description": "Skiltet varsler om...",
      "image_url": "https://...",
      "image_file": "local/path/to/image.png",
      "source_url": "https://lovdata.no/...",
      "lovdata_reference": "§ 5-1"
    }
  ],
  "metadata": {
    "total_signs": 150,
    "categories": ["Fareskilt", "Forbudsskilt", ...],
    "scraped_at": "2024-01-01T12:00:00"
  }
}
```

## License

MIT