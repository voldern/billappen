"""Markdown file reader for theory content."""

import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from .models import ChapterContent


class MarkdownReader:
    """Reader for markdown theory files."""
    
    def __init__(self, markdown_dir: Path):
        """Initialize the markdown reader.
        
        Args:
            markdown_dir: Directory containing markdown files
        """
        self.markdown_dir = Path(markdown_dir)
        
    def find_markdown_files(self) -> List[Path]:
        """Find all markdown files in the directory."""
        markdown_files = []
        for file in self.markdown_dir.glob("*.md"):
            # Skip summary/intro files that might not have substantial content
            if not any(skip in file.name.lower() for skip in ["nøkkelord", "fullført", "oppsummering"]):
                markdown_files.append(file)
        return sorted(markdown_files)
    
    def parse_file(self, file_path: Path) -> Optional[ChapterContent]:
        """Parse a single markdown file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract metadata if present
            metadata = self._extract_metadata(content)
            
            # Extract title and chapter number
            title, chapter_number = self._extract_title_and_chapter(file_path.name, content)
            
            # Clean and extract main content
            main_content = self._extract_main_content(content)
            
            # Extract subsections
            subsections = self._extract_subsections(content)
            
            # Only return if we have substantial content
            if len(main_content.strip()) < 100:
                return None
                
            return ChapterContent(
                title=title,
                chapter_number=chapter_number,
                content=main_content,
                metadata=metadata,
                subsections=subsections
            )
            
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
            return None
    
    def _extract_metadata(self, content: str) -> Dict[str, Any]:
        """Extract YAML frontmatter metadata."""
        metadata = {}
        
        # Look for YAML frontmatter
        yaml_match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
        if yaml_match:
            yaml_content = yaml_match.group(1)
            for line in yaml_content.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    metadata[key.strip()] = value.strip()
        
        return metadata
    
    def _extract_title_and_chapter(self, filename: str, content: str) -> tuple[str, str]:
        """Extract title and chapter number from filename and content."""
        # Try to extract from filename first
        filename_parts = filename.replace('.md', '').split(' - ', 1)
        chapter_number = filename_parts[0] if filename_parts else "unknown"
        
        # Try to extract title from first heading in content
        title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        if title_match:
            title = title_match.group(1).strip()
            # Remove "Kapittel X:" prefix if present
            title = re.sub(r'^Kapittel\s+[\d.]+:\s*', '', title)
        else:
            # Fallback to filename
            title = filename_parts[1] if len(filename_parts) > 1 else filename_parts[0]
        
        return title, chapter_number
    
    def _extract_main_content(self, content: str) -> str:
        """Extract and clean main content."""
        # Remove YAML frontmatter
        content = re.sub(r'^---\n.*?\n---\n', '', content, flags=re.DOTALL)
        
        # Remove the main title (first H1)
        content = re.sub(r'^#\s+.+\n', '', content, flags=re.MULTILINE)
        
        # Clean up excessive whitespace
        content = re.sub(r'\n{3,}', '\n\n', content)
        
        # Remove empty lines at start and end
        content = content.strip()
        
        return content
    
    def _extract_subsections(self, content: str) -> List[Dict[str, str]]:
        """Extract subsections from content."""
        subsections = []
        
        # Find all headings (H2, H3, H4)
        heading_pattern = r'^(#{2,4})\s+(.+)$'
        
        lines = content.split('\n')
        current_section = None
        current_content = []
        
        for line in lines:
            heading_match = re.match(heading_pattern, line)
            if heading_match:
                # Save previous section if exists
                if current_section:
                    subsections.append({
                        'title': current_section,
                        'content': '\n'.join(current_content).strip()
                    })
                
                # Start new section
                current_section = heading_match.group(2).strip()
                current_content = []
            else:
                if current_section:
                    current_content.append(line)
        
        # Add the last section
        if current_section:
            subsections.append({
                'title': current_section,
                'content': '\n'.join(current_content).strip()
            })
        
        return subsections
    
    def get_content_summary(self, chapter: ChapterContent) -> str:
        """Get a summary of chapter content for question generation."""
        summary_parts = [f"Chapter: {chapter.title}"]
        
        if chapter.subsections:
            summary_parts.append("Topics covered:")
            for subsection in chapter.subsections:
                if subsection['content'].strip():
                    summary_parts.append(f"- {subsection['title']}")
        
        # Add a sample of the main content (first 500 chars)
        if len(chapter.content) > 500:
            summary_parts.append(f"Content sample: {chapter.content[:500]}...")
        else:
            summary_parts.append(f"Content: {chapter.content}")
        
        return '\n'.join(summary_parts)