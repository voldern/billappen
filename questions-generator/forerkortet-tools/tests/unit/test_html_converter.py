"""Unit tests for HTML to Markdown converter."""

import pytest
from pathlib import Path

from forerkortet_tools.html_converter import HTMLToMarkdownConverter


class TestHTMLToMarkdownConverter:
    """Test HTML to Markdown conversion functionality."""
    
    def test_converter_initialization(self, temp_dir):
        """Test converter initialization."""
        output_dir = temp_dir / "output"
        converter = HTMLToMarkdownConverter(temp_dir, output_dir)
        
        assert converter.html_dir == temp_dir
        assert converter.output_dir == output_dir
        assert output_dir.exists()
    
    def test_find_html_files(self, temp_dir):
        """Test finding HTML files."""
        # Create test files
        (temp_dir / "chapter1.html").write_text("<html></html>")
        (temp_dir / "chapter2.html").write_text("<html></html>")
        (temp_dir / "resource_files.html").write_text("<html></html>")
        (temp_dir / "not_html.txt").write_text("text")
        
        converter = HTMLToMarkdownConverter(temp_dir, temp_dir / "output")
        files = converter.find_html_files()
        
        assert len(files) == 2  # Excludes resource_files.html
        assert all(f.suffix == ".html" for f in files)
        assert all("_files" not in f.name for f in files)
    
    def test_convert_single_file(self, sample_html_file, temp_dir):
        """Test converting a single HTML file."""
        output_dir = temp_dir / "output"
        converter = HTMLToMarkdownConverter(sample_html_file.parent, output_dir)
        
        output_file = converter.convert_file(sample_html_file)
        
        assert output_file is not None
        assert output_file.exists()
        assert output_file.suffix == ".md"
        
        # Check content
        content = output_file.read_text(encoding="utf-8")
        assert "# Kapittel 1.1.1: Test Chapter" in content
        assert "chapter: 1.1.1" in content
        assert "title: Test Chapter" in content
        assert "## Subsection 1" in content
        assert "## Subsection 2" in content
    
    def test_extract_title(self, temp_dir):
        """Test title extraction from HTML."""
        from bs4 import BeautifulSoup
        
        converter = HTMLToMarkdownConverter(temp_dir, temp_dir)
        
        # Test with title tag
        html = "<html><head><title>Test Title</title></head></html>"
        soup = BeautifulSoup(html, "lxml")
        assert converter.extract_title(soup) == "Test Title"
        
        # Test with h1 tag
        html = "<html><body><h1>H1 Title</h1></body></html>"
        soup = BeautifulSoup(html, "lxml")
        assert converter.extract_title(soup) == "H1 Title"
        
        # Test with no title
        html = "<html><body><p>Content</p></body></html>"
        soup = BeautifulSoup(html, "lxml")
        assert converter.extract_title(soup) == "Untitled"
    
    def test_remove_heading_duplicates(self, temp_dir):
        """Test duplicate heading removal."""
        converter = HTMLToMarkdownConverter(temp_dir, temp_dir)
        
        # Test exact duplication
        assert converter._remove_heading_duplicates("Test Test") == "Test"
        
        # Test word duplication
        assert converter._remove_heading_duplicates("Farlig sving Farlig sving") == "Farlig sving"
        
        # Test no duplication
        assert converter._remove_heading_duplicates("Normal heading") == "Normal heading"
        
        # Test concatenated words
        result = converter._remove_heading_duplicates("reaksjonerOffentlige reaksjoner")
        assert "Offentlige reaksjoner" in result
    
    def test_clean_markdown(self, temp_dir):
        """Test markdown cleaning."""
        converter = HTMLToMarkdownConverter(temp_dir, temp_dir)
        
        # Test multiple blank lines
        md = "Line 1\n\n\n\nLine 2"
        cleaned = converter.clean_markdown(md)
        assert "\n\n\n" not in cleaned
        
        # Test empty formatting
        md = "Text **  ** more text"
        cleaned = converter.clean_markdown(md)
        assert "**  **" not in cleaned
        
        # Test navigation text removal
        md = "Content\nForrige\nNeste\nMore content"
        cleaned = converter.clean_markdown(md)
        assert "Forrige" not in cleaned
        assert "Neste" not in cleaned