"""HTML to Markdown converter for Norwegian driving theory book."""

import re
from pathlib import Path
from typing import List, Optional, Set, Tuple

import html2text
from bs4 import BeautifulSoup, NavigableString
from markdownify import markdownify as md
from rich.console import Console
from rich.progress import track

from ..utils.console import get_console
from ..utils.file_utils import ensure_directory


class HTMLToMarkdownConverter:
    """Converts HTML theory book chapters to structured Markdown files."""
    
    def __init__(self, html_dir: Path, output_dir: Path, console: Optional[Console] = None):
        """Initialize the converter.
        
        Args:
            html_dir: Directory containing HTML files
            output_dir: Directory to save markdown files
            console: Optional Rich console for output
        """
        self.html_dir = Path(html_dir)
        self.output_dir = Path(output_dir)
        self.console = console or get_console()
        
        ensure_directory(self.output_dir)
        
        # Configure html2text
        self.h2t = html2text.HTML2Text()
        self.h2t.ignore_links = False
        self.h2t.ignore_images = False
        self.h2t.body_width = 0  # Don't wrap lines
        self.h2t.unicode_snob = True
        self.h2t.skip_internal_links = True
        
    def find_html_files(self) -> List[Path]:
        """Find all main HTML files (excluding resource files)."""
        html_files = []
        for file in self.html_dir.glob("*.html"):
            # Skip resource files
            if "_files" not in file.name and "saved_resource" not in file.name:
                html_files.append(file)
        return sorted(html_files)
    
    def extract_title(self, soup: BeautifulSoup) -> str:
        """Extract chapter title from HTML."""
        # Try to find title in various places
        title_elem = (
            soup.find("title") or 
            soup.find("h1") or 
            soup.find("meta", {"property": "og:title"})
        )
        
        if title_elem:
            if hasattr(title_elem, 'get'):
                return title_elem.get('content', title_elem.get_text(strip=True))
            return title_elem.get_text(strip=True)
        
        return "Untitled"
    
    def extract_main_content(self, soup: BeautifulSoup) -> str:
        """Extract the main content from the HTML."""
        # Remove script and style elements
        for elem in soup(["script", "style", "iframe", "noscript", "nav", "header", "footer"]):
            elem.decompose()
            
        # Remove unwanted elements by class/id patterns
        unwanted_patterns = [
            re.compile(r"nav|menu|header|footer|sidebar|ads?|social|share|comment", re.I),
            re.compile(r"cookie|gdpr|consent", re.I)
        ]
        
        for pattern in unwanted_patterns:
            for elem in soup.find_all(attrs={"class": pattern}):
                elem.decompose()
            for elem in soup.find_all(attrs={"id": pattern}):
                elem.decompose()
        
        # Try to find main content area - look for specific content containers
        content_selectors = [
            "main",
            "article", 
            "[role='main']",
            ".content",
            ".main-content",
            ".course-content",
            ".teorikurs-content",
            "#content",
            "#main-content"
        ]
        
        content = None
        for selector in content_selectors:
            try:
                content = soup.select_one(selector)
                if content and len(content.get_text(strip=True)) > 100:
                    break
            except Exception:
                continue
        
        # If no specific content area found, look for the largest text container
        if not content:
            # Find all divs and get the one with most text content
            divs = soup.find_all("div")
            if divs:
                content = max(divs, key=lambda d: len(d.get_text(strip=True)), default=None)
        
        # Fallback to body
        if not content:
            content = soup.find("body")
            
        if not content:
            return ""
            
        # Clean up the content
        return self.clean_content(content)
    
    def clean_content(self, element) -> str:
        """Clean and extract text content from HTML element."""
        # Remove navigation, headers, footers, ads
        for unwanted in element.find_all(
            ["nav", "header", "footer", "aside"],
            class_=re.compile(r"nav|header|footer|sidebar|menu|ad", re.I)
        ):
            unwanted.decompose()
            
        # Convert to markdown
        html_str = str(element)
        
        # Use markdownify for better conversion
        markdown = md(html_str, 
                     heading_style="ATX",
                     bullets="-",
                     code_language="",
                     strip=["a"])
        
        # Clean up the markdown
        markdown = self.clean_markdown(markdown)
        
        return markdown
    
    def clean_markdown(self, markdown: str) -> str:
        """Clean up the converted markdown."""
        # Remove multiple blank lines
        markdown = re.sub(r'\n{3,}', '\n\n', markdown)
        
        # Remove leading/trailing whitespace from lines
        lines = [line.rstrip() for line in markdown.split('\n')]
        markdown = '\n'.join(lines)
        
        # Fix common conversion issues
        markdown = re.sub(r'\*\*\s*\*\*', '', markdown)  # Remove empty bold
        markdown = re.sub(r'__\s*__', '', markdown)  # Remove empty italic
        markdown = re.sub(r'\[\s*\]\s*\(\s*\)', '', markdown)  # Remove empty links
        
        # Advanced duplicate removal and text cleaning
        lines = markdown.split('\n')
        cleaned_lines = []
        seen_content: Set[str] = set()
        
        for i, line in enumerate(lines):
            original_line = line
            line = line.strip()
            
            if not line:
                cleaned_lines.append('')
                continue
            
            # Remove lines that are just numbers (likely navigation/page numbers)
            if re.match(r'^#?\d+$', line):
                continue
                
            # Remove navigation text
            if re.match(r'^(Forrige|Neste|Tilbake.*|Previous|Next)$', line, re.I):
                continue
            
            # Handle headings specially - remove duplicate heading text
            if line.startswith('#'):
                heading_level = len(re.match(r'^#+', line).group())
                heading_content = re.sub(r'^#+\s*', '', line)
                
                # Fix duplicated text within headings using multiple strategies
                cleaned_heading = self._remove_heading_duplicates(heading_content)
                line = '#' * heading_level + ' ' + cleaned_heading
            
            # Check for duplicate consecutive content (exact match)
            if i > 0 and line == lines[i-1].strip():
                continue
            
            # Check for content that appears to be duplicated within the same line
            if not line.startswith('#') and not line.startswith('-') and not line.startswith('*'):
                line = self._remove_line_duplicates(line)
            
            # Check against previously seen content (fuzzy matching for similar content)
            content_words = set(re.findall(r'\w+', line.lower()))
            is_duplicate = False
            
            for seen in seen_content:
                seen_words = set(re.findall(r'\w+', seen.lower()))
                # If 80% of words overlap and both have substantial content, it's likely a duplicate
                if (len(content_words) > 5 and len(seen_words) > 5 and 
                    len(content_words & seen_words) / len(content_words | seen_words) > 0.8):
                    is_duplicate = True
                    break
            
            if not is_duplicate and len(content_words) > 2:  # Only track substantial content
                seen_content.add(line)
                cleaned_lines.append(line)
            elif len(content_words) <= 2:  # Keep short lines (might be important)
                cleaned_lines.append(line)
        
        markdown = '\n'.join(cleaned_lines)
        
        # Remove HTML comments
        markdown = re.sub(r'<!--.*?-->', '', markdown, flags=re.DOTALL)
        
        # Clean up remaining HTML entities
        markdown = re.sub(r'&\w+;', '', markdown)
        
        # Remove excessive whitespace
        markdown = re.sub(r' {2,}', ' ', markdown)
        
        return markdown.strip()
    
    def _remove_heading_duplicates(self, heading_content: str) -> str:
        """Remove duplicated text within headings using multiple strategies."""
        
        # First check if the entire text is exactly duplicated (character level)
        text_no_spaces = heading_content.replace(' ', '')
        if len(text_no_spaces) % 2 == 0:
            half_len = len(text_no_spaces) // 2
            first_half = text_no_spaces[:half_len]
            second_half = text_no_spaces[half_len:]
            if first_half == second_half:
                # The text is exactly duplicated at character level
                # Return the first half with original spacing preserved
                original_half_len = len(heading_content) // 2
                return heading_content[:original_half_len]
        
        # Strategy 1: Check if text is simply concatenated (no spaces between duplicates)
        words = heading_content.split()
        
        # Special case: check if it's just the same word repeated without spaces
        if len(words) == 1:
            word = words[0]
            # Check if the word contains repeated patterns
            for i in range(1, len(word) // 2 + 1):
                if len(word) % i == 0:
                    pattern = word[:i]
                    if pattern * (len(word) // i) == word:
                        return pattern
        
        # Strategy 2: Check for exact duplicates by splitting in half (word level)
        if len(words) > 1:
            half_len = len(words) // 2
            first_half = ' '.join(words[:half_len])
            second_half = ' '.join(words[half_len:])
            
            if first_half == second_half and half_len > 0:
                return first_half
        
        # Strategy 3: Look for repeating patterns of 2+ words
        for pattern_length in range(min(len(words) // 2, 10), 1, -1):
            for start in range(len(words) - pattern_length):
                pattern = words[start:start + pattern_length]
                
                # Check if this pattern repeats immediately after
                next_start = start + pattern_length
                if next_start + pattern_length <= len(words):
                    next_pattern = words[next_start:next_start + pattern_length]
                    if pattern == next_pattern:
                        # Found a duplicate pattern, remove it
                        new_words = words[:start + pattern_length] + words[next_start + pattern_length:]
                        return self._remove_heading_duplicates(' '.join(new_words))
        
        # Strategy 4: Look for words that might be concatenated with other words
        # E.g., "reaksjonerOffentlige" should be split
        for i, word in enumerate(words):
            if len(word) > 10:  # Only check long words
                # Look for capital letters in the middle that might indicate concatenation
                for j in range(1, len(word)):
                    if word[j].isupper():
                        # Try splitting here
                        part1 = word[:j]
                        part2 = word[j:]
                        
                        # Check if this creates a pattern
                        test_words = words[:i] + [part1, part2] + words[i+1:]
                        
                        # Now check if this new word list has duplicates
                        half_len = len(test_words) // 2
                        if len(test_words) % 2 == 0:
                            first_half = ' '.join(test_words[:half_len])
                            second_half = ' '.join(test_words[half_len:])
                            if first_half == second_half:
                                return first_half
        
        # Strategy 5: Look for duplicate words that appear consecutively
        clean_words = []
        prev_word = None
        for word in words:
            if word.lower() != (prev_word or '').lower():
                clean_words.append(word)
            prev_word = word
        
        return ' '.join(clean_words)
    
    def _remove_line_duplicates(self, line: str) -> str:
        """Remove duplicated content within a single line."""
        # Check if the line contains duplicated sentences
        sentences = re.split(r'[.!?]+\s+', line)
        if len(sentences) > 1:
            unique_sentences = []
            seen_sentences: Set[str] = set()
            
            for sentence in sentences:
                sentence = sentence.strip()
                if sentence:
                    # Normalize for comparison
                    normalized = re.sub(r'\s+', ' ', sentence.lower())
                    if normalized not in seen_sentences:
                        unique_sentences.append(sentence)
                        seen_sentences.add(normalized)
            
            if len(unique_sentences) < len([s for s in sentences if s.strip()]):
                # Reconstruct the line with unique sentences
                line = '. '.join(unique_sentences)
                if line and not line.endswith('.'):
                    line += '.'
        
        # Check for word-level duplicates in the middle of the line
        words = line.split()
        if len(words) > 4:
            # Look for patterns where the same phrase appears twice
            for pattern_length in range(min(len(words) // 2, 8), 2, -1):
                for start in range(len(words) - pattern_length):
                    pattern = words[start:start + pattern_length]
                    pattern_str = ' '.join(pattern).lower()
                    
                    # Look for this pattern elsewhere in the line
                    remaining_words = words[start + pattern_length:]
                    remaining_str = ' '.join(remaining_words).lower()
                    
                    if pattern_str in remaining_str:
                        # Find the exact position and remove the duplicate
                        for next_start in range(len(remaining_words) - pattern_length + 1):
                            next_pattern = remaining_words[next_start:next_start + pattern_length]
                            if [w.lower() for w in pattern] == [w.lower() for w in next_pattern]:
                                # Remove the duplicate pattern
                                new_words = (words[:start + pattern_length] + 
                                            remaining_words[:next_start] + 
                                            remaining_words[next_start + pattern_length:])
                                return self._remove_line_duplicates(' '.join(new_words))
        
        return line
    
    def create_chapter_structure(self, chapter_num: str, title: str, content: str) -> str:
        """Create a well-structured markdown document."""
        # Extract chapter number and clean title
        chapter_parts = chapter_num.split('.')
        main_chapter = chapter_parts[0] if chapter_parts else "0"
        
        # Clean the title
        title = re.sub(r'^\d+(\.\d+)*\s*-?\s*', '', title)
        
        markdown = f"# Kapittel {chapter_num}: {title}\n\n"
        
        # Add metadata
        markdown += f"---\n"
        markdown += f"chapter: {chapter_num}\n"
        markdown += f"title: {title}\n"
        markdown += f"---\n\n"
        
        # Add content
        markdown += content
        
        return markdown
    
    def convert_file(self, html_file: Path) -> Optional[Path]:
        """Convert a single HTML file to Markdown."""
        try:
            # Read HTML file
            with open(html_file, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            # Parse HTML
            soup = BeautifulSoup(html_content, 'lxml')
            
            # Extract components
            title = self.extract_title(soup)
            content = self.extract_main_content(soup)
            
            if not content or len(content.strip()) < 100:
                self.console.print(f"[yellow]⚠️  Skipping {html_file.name} - insufficient content[/yellow]")
                return None
            
            # Extract chapter number from filename
            filename = html_file.stem
            chapter_match = re.match(r'^(\d+(?:\.\d+)*)', filename)
            chapter_num = chapter_match.group(1) if chapter_match else "0"
            
            # Create structured markdown
            markdown = self.create_chapter_structure(chapter_num, title, content)
            
            # Save to file
            output_filename = f"{chapter_num} - {re.sub(r'[^a-zA-Z0-9æøåÆØÅ\s-]', '', title)}.md"
            output_file = self.output_dir / output_filename
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(markdown)
            
            return output_file
            
        except Exception as e:
            self.console.print(f"[red]❌ Error converting {html_file.name}: {e}[/red]")
            return None
    
    def convert_all(self) -> Tuple[int, int]:
        """Convert all HTML files to Markdown.
        
        Returns:
            Tuple of (successful conversions, total files)
        """
        html_files = self.find_html_files()
        
        if not html_files:
            self.console.print("[red]No HTML files found![/red]")
            return 0, 0
        
        self.console.print(f"[green]Found {len(html_files)} HTML files to convert[/green]")
        
        successful = 0
        for html_file in track(html_files, description="Converting files...", console=self.console):
            output_file = self.convert_file(html_file)
            if output_file:
                successful += 1
                self.console.print(f"[green]✓[/green] {html_file.name} → {output_file.name}")
        
        self.console.print(f"\n[bold green]Conversion complete![/bold green]")
        self.console.print(f"Successfully converted {successful}/{len(html_files)} files")
        
        return successful, len(html_files)