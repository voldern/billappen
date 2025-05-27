"""Pytest configuration and fixtures."""

import json
import shutil
from pathlib import Path

import pytest


@pytest.fixture
def temp_dir(tmp_path):
    """Create a temporary directory for tests."""
    return tmp_path


@pytest.fixture
def sample_html_file(temp_dir):
    """Create a sample HTML file for testing."""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>1.1.1 - Test Chapter</title>
    </head>
    <body>
        <h1>Kapittel 1.1.1: Test Chapter</h1>
        <main>
            <p>This is a test chapter content with sufficient text to be processed.</p>
            <p>It contains multiple paragraphs to ensure we have enough content.</p>
            <h2>Subsection 1</h2>
            <p>Content for subsection 1.</p>
            <h2>Subsection 2</h2>
            <p>Content for subsection 2.</p>
        </main>
    </body>
    </html>
    """
    
    html_file = temp_dir / "1.1.1 - Test Chapter.html"
    html_file.write_text(html_content, encoding="utf-8")
    return html_file


@pytest.fixture
def sample_markdown_file(temp_dir):
    """Create a sample markdown file for testing."""
    md_content = """# Kapittel 1.1.1: Test Chapter

---
chapter: 1.1.1
title: Test Chapter
---

This is a test chapter content with sufficient text to be processed.
It contains multiple paragraphs to ensure we have enough content.

## Subsection 1

Content for subsection 1 with detailed information about driving theory.
This section covers important aspects of Norwegian traffic rules.

## Subsection 2

Content for subsection 2 with more driving-related content.
Safety is paramount when operating a vehicle on Norwegian roads.
"""
    
    md_file = temp_dir / "1.1.1 - Test Chapter.md"
    md_file.write_text(md_content, encoding="utf-8")
    return md_file


@pytest.fixture
def sample_road_signs_data(temp_dir):
    """Create sample road signs data for testing."""
    signs_data = {
        "signs": [
            {
                "id": "100",
                "name": "100 Farlig sving",
                "category": "Fareskilt",
                "description": "Skiltet varsler om farlig sving. Svingens retning fremgår av skiltet.",
                "image_url": "https://example.com/sign100.png",
                "source_url": "https://lovdata.no/test",
                "lovdata_reference": "§ 5-1"
            },
            {
                "id": "362",
                "name": "362 Fartsgrense",
                "category": "Forbudsskilt",
                "description": "Forbudet gjelder fra skiltet og til neste fartsgrenseskilt, til skilt 364 'Slutt på særskilt fartsgrense'.",
                "image_url": "https://example.com/sign362.png",
                "source_url": "https://lovdata.no/test2",
                "lovdata_reference": "§ 5-2"
            }
        ],
        "metadata": {
            "source": "https://www.vegvesen.no/test",
            "total_signs": 2,
            "categories": ["Fareskilt", "Forbudsskilt"]
        }
    }
    
    json_file = temp_dir / "road_signs_test.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(signs_data, f, ensure_ascii=False, indent=2)
    
    return json_file


@pytest.fixture
def mock_openai_response():
    """Mock OpenAI API response for testing."""
    return {
        "choices": [{
            "message": {
                "content": json.dumps([{
                    "question": "Hva må du gjøre når du ser et fareskilt?",
                    "correct_answer": "Redusere farten og være ekstra oppmerksom",
                    "incorrect_answers": [
                        "Øke farten for å komme raskere forbi",
                        "Stoppe umiddelbart",
                        "Snu og kjøre tilbake"
                    ],
                    "explanation": "Fareskilt varsler om farlige situasjoner fremover.",
                    "category": "Skilt og signaler",
                    "difficulty": "medium"
                }])
            }
        }]
    }