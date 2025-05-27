"""Main scraper for road signs data."""

import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from rich.console import Console
from rich.progress import track

from ..utils.console import get_console
from ..utils.file_utils import ensure_directory
from .models import RoadSign, ScrapingSession, SignCategory


class RoadSignsScraper:
    """Scraper for Norwegian road signs from Vegvesen and Lovdata."""
    
    def __init__(self, delay: float = 1.0, console: Optional[Console] = None):
        """Initialize the scraper.
        
        Args:
            delay: Delay between requests in seconds
            console: Optional Rich console for output
        """
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.delay = delay
        self.console = console or get_console()
        self.base_vegvesen_url = "https://www.vegvesen.no"
        self.base_lovdata_url = "https://lovdata.no"
        
    def scrape_all(self, download_images: bool = False, images_dir: Optional[Path] = None) -> ScrapingSession:
        """Scrape all road signs data.
        
        Args:
            download_images: Whether to download sign images
            images_dir: Directory to save images
            
        Returns:
            ScrapingSession with all scraped data
        """
        self.console.print("[green]🚗 Starting road signs scraping...[/green]")
        
        scraping_session = ScrapingSession()
        scraping_session.metadata = {
            "source": "https://www.vegvesen.no/trafikkinformasjon/langs-veien/trafikkskilt/",
            "method": "vegvesen_to_lovdata"
        }
        
        # Step 1: Get all Lovdata links from Vegvesen
        self.console.print("[blue]📋 Finding Lovdata links from Vegvesen...[/blue]")
        lovdata_links = self._get_lovdata_links_from_vegvesen()
        
        if not lovdata_links:
            self.console.print("[red]❌ No Lovdata links found![/red]")
            return scraping_session
        
        self.console.print(f"[green]✓ Found {len(lovdata_links)} Lovdata links[/green]")
        
        # Step 2: Scrape each Lovdata page
        self.console.print("[blue]🔍 Scraping sign data from Lovdata pages...[/blue]")
        
        for link_info in track(lovdata_links, description="Processing Lovdata pages...", console=self.console):
            try:
                signs = self._scrape_lovdata_page(link_info['url'], link_info.get('category', 'Unknown'))
                
                for sign in signs:
                    scraping_session.add_sign(sign)
                
                self.console.print(f"[green]✓[/green] {link_info.get('title', 'Page')}: {len(signs)} signs")
                
                # Be respectful with delays
                time.sleep(self.delay)
                
            except Exception as e:
                self.console.print(f"[red]❌ Error scraping {link_info['url']}: {e}[/red]")
                continue
        
        # Step 3: Download images if requested
        if download_images and images_dir:
            self.console.print(f"[blue]📥 Downloading images to {images_dir}...[/blue]")
            self._download_images(scraping_session.signs, images_dir)
        
        self.console.print(f"\n[bold green]✅ Scraping complete![/bold green]")
        self.console.print(f"Total signs collected: {len(scraping_session.signs)}")
        self.console.print(f"Categories: {', '.join(scraping_session.get_categories())}")
        
        return scraping_session
    
    def _get_lovdata_links_from_vegvesen(self) -> List[Dict[str, str]]:
        """Get all Lovdata links from the Vegvesen traffic signs page."""
        url = "https://www.vegvesen.no/trafikkinformasjon/langs-veien/trafikkskilt/"
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find all links that go to lovdata.no
            lovdata_links = []
            
            for link in soup.find_all('a', href=True):
                href = link['href']
                
                # Check if it's a Lovdata link
                if 'lovdata.no' in href:
                    # Get the full URL
                    full_url = href if href.startswith('http') else urljoin(url, href)
                    
                    # Extract title/text
                    title = link.get_text(strip=True)
                    
                    # Try to determine category from context
                    category = self._extract_category_from_context(link)
                    
                    lovdata_links.append({
                        'url': full_url,
                        'title': title,
                        'category': category
                    })
            
            # Remove duplicates
            seen = set()
            unique_links = []
            for link in lovdata_links:
                if link['url'] not in seen:
                    seen.add(link['url'])
                    unique_links.append(link)
            
            return unique_links
            
        except Exception as e:
            self.console.print(f"[red]Error fetching Vegvesen page: {e}[/red]")
            return []
    
    def _extract_category_from_context(self, link_element) -> str:
        """Try to extract category from the context around the link."""
        # Look for heading elements above the link
        parent = link_element.parent
        while parent:
            # Check for headings
            for heading in parent.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
                text = heading.get_text(strip=True).lower()
                if any(word in text for word in ['fare', 'forbud', 'påbud', 'opplysning', 'service', 'vegvisning']):
                    return heading.get_text(strip=True)
            
            parent = parent.parent
            if not parent or parent.name == 'body':
                break
        
        # Fallback: check the link text itself
        link_text = link_element.get_text(strip=True).lower()
        if 'fare' in link_text:
            return 'Fareskilt'
        elif 'forbud' in link_text:
            return 'Forbudsskilt'
        elif 'påbud' in link_text:
            return 'Påbudsskilt'
        elif 'opplysning' in link_text:
            return 'Opplysningsskilt'
        elif 'service' in link_text:
            return 'Serviceskilt'
        elif 'vegvisning' in link_text:
            return 'Vegvisningsskilt'
        else:
            return 'Ukjent'
    
    def _scrape_lovdata_page(self, url: str, category: str) -> List[RoadSign]:
        """Scrape a single Lovdata page for road sign data."""
        try:
            response = self.session.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            signs = []
            
            # Look for tables containing road sign data
            tables = soup.find_all('table')
            
            for table in tables:
                signs.extend(self._extract_signs_from_table(table, url, category))
            
            # Also look for individual sign definitions outside tables
            signs.extend(self._extract_individual_signs(soup, url, category))
            
            return signs
            
        except Exception as e:
            self.console.print(f"[red]Error scraping Lovdata page {url}: {e}[/red]")
            return []
    
    def _extract_signs_from_table(self, table, source_url: str, category: str) -> List[RoadSign]:
        """Extract road signs from a table element."""
        signs = []
        rows = table.find_all('tr')
        
        for row in rows:
            cells = row.find_all(['td', 'th'])
            
            if len(cells) < 2:  # Need at least 2 columns
                continue
            
            # Look for images in the row
            images = row.find_all('img')
            if not images:
                continue
            
            # Extract sign data
            sign_data = self._extract_sign_data_from_row(row, cells, images, source_url, category)
            if sign_data:
                signs.append(sign_data)
        
        return signs
    
    def _extract_sign_data_from_row(self, row, cells, images, source_url: str, category: str) -> Optional[RoadSign]:
        """Extract sign data from a table row."""
        try:
            # Get image
            img = images[0]
            image_url = img.get('src')
            if image_url and not image_url.startswith('http'):
                image_url = urljoin(source_url, image_url)
            
            # Extract sign ID/number from image filename or alt text
            sign_id = self._extract_sign_id(img, row)
            
            # Extract name/description from cell text
            name, description = self._extract_name_and_description(cells, row)
            
            # Extract legal reference
            legal_ref = self._extract_legal_reference(row)
            
            if not sign_id or not name:
                return None
            
            return RoadSign(
                id=sign_id,
                name=name,
                category=category,
                description=description,
                image_url=image_url,
                source_url=source_url,
                lovdata_reference=legal_ref
            )
            
        except Exception as e:
            self.console.print(f"[yellow]⚠️ Error extracting sign from row: {e}[/yellow]")
            return None
    
    def _extract_sign_id(self, img, row) -> Optional[str]:
        """Extract sign ID from image or row context."""
        # First, try to extract from text content (most reliable)
        row_text = row.get_text().strip()
        
        # Pattern: "100 Farlig sving" -> 100 (sign number at start)
        id_match = re.match(r'^(\d{2,3}(?:\.\d+)?)', row_text)
        if id_match:
            return id_match.group(1)
        
        # Try image filename - look for sign numbers like "100", "102-1", etc.
        src = img.get('src', '')
        if src:
            # Extract filename
            filename = Path(src).stem if src else ''
            
            # Look for patterns like "100", "102-1", "102-2" in the filename
            # Common patterns: sf-20051007-1219-100-1-01.gif -> 100
            # We want the number after the regulation parts
            parts = filename.split('-')
            
            # Look for a 2-3 digit number that's likely a sign number
            for i, part in enumerate(parts):
                if re.match(r'^\d{2,3}$', part):
                    # Check if this looks like a sign number (not a year/regulation)
                    if int(part) >= 100 and int(part) <= 999:
                        return part
            
            # Fallback pattern for complex sign numbers
            id_match = re.search(r'-(\d{2,3}(?:-\d+)?)-', filename)
            if id_match:
                return id_match.group(1)
        
        # Try alt text
        alt = img.get('alt', '')
        if alt:
            id_match = re.search(r'(\d{2,3})', alt)
            if id_match:
                return id_match.group(1)
        
        # Look for any 2-3 digit number in the text as fallback
        id_match = re.search(r'\b(\d{2,3})\b', row_text)
        if id_match:
            number = int(id_match.group(1))
            # Only return if it looks like a valid sign number
            if 100 <= number <= 999:
                return id_match.group(1)
        
        return None
    
    def _extract_name_and_description(self, cells, row) -> Tuple[str, str]:
        """Extract name and description from table cells."""
        name = ""
        description = ""
        
        # Get text from all cells (excluding image cells)
        text_cells = []
        for cell in cells:
            cell_text = cell.get_text(strip=True)
            # Skip cells that only contain images or numbers
            if cell_text and not re.match(r'^\d+$', cell_text) and not cell.find('img'):
                text_cells.append(cell_text)
        
        if text_cells:
            full_text = text_cells[0]  # First text cell
            
            # Method 1: Look for pattern "NUMBER NAME + Description"
            # Examples: "124 Farlig vegkryssSkiltet varsler om..."
            #           "362 FartsgrenseForbudet gjelder..."
            
            # Pattern to match: number + basic name + optional description
            # Match up to the first capital letter that starts what looks like a sentence
            pattern = r'^(\d+(?:\.\d+)?\s+[A-ZÆØÅ][a-zæøåA-ZÆØÅ\s]*?)([A-ZÆØÅ][a-zæøå].*|$)'
            match = re.match(pattern, full_text)
            
            if match:
                potential_name = match.group(1).strip()
                potential_desc = match.group(2).strip() if match.group(2) else ""
                
                # If the name looks reasonable (not too long), use it
                if len(potential_name) <= 50:
                    name = potential_name
                    description = potential_desc
                else:
                    # Name too long, try different approach
                    name = self._extract_basic_name_fallback(full_text)
                    description = full_text[len(name):].strip()
            else:
                # Method 2: Try to split at common sentence starters
                # Look for patterns like "Skiltet angir", "Forbudet gjelder", etc.
                sentence_starters = [
                    r'Skiltet\s+(?:angir|varsler)',
                    r'Forbudet\s+gjelder',
                    r'Påbudet\s+gjelder',
                    r'(?:Dette|Den)\s+(?:skiltet|forbudet|påbudet)'
                ]
                
                split_found = False
                for starter_pattern in sentence_starters:
                    match = re.search(starter_pattern, full_text, re.IGNORECASE)
                    if match:
                        name = full_text[:match.start()].strip()
                        description = full_text[match.start():].strip()
                        split_found = True
                        break
                
                if not split_found:
                    # Method 3: Extract basic name (number + first few words)
                    name = self._extract_basic_name_fallback(full_text)
                    description = full_text[len(name):].strip() if len(full_text) > len(name) else ""
            
            # Clean up description
            if description:
                # Remove leading punctuation and whitespace
                description = re.sub(r'^[.!?]*\s*', '', description)
                # If description is just punctuation, clear it
                if re.match(r'^[.!?\s]*$', description):
                    description = ""
            
            # Add remaining cells to description
            if len(text_cells) > 1:
                remaining_desc = ' '.join(text_cells[1:])
                if description:
                    description = f"{description} {remaining_desc}".strip()
                else:
                    description = remaining_desc.strip()
        
        return name, description
    
    def _extract_basic_name_fallback(self, full_text: str) -> str:
        """Extract basic name as fallback: number + up to 3-4 words."""
        # Pattern: number + up to 4 words (handles compound words)
        pattern = r'^(\d+(?:\.\d+)?\s+(?:\w+\s*){1,4})'
        match = re.match(pattern, full_text)
        if match:
            return match.group(1).strip()
        
        # Ultra fallback: just take first 30 characters
        return full_text[:30].strip() if len(full_text) > 30 else full_text
    
    def _extract_legal_reference(self, row) -> Optional[str]:
        """Extract legal reference like § 5-1."""
        row_text = row.get_text()
        ref_match = re.search(r'§\s*[\d-]+', row_text)
        return ref_match.group(0) if ref_match else None
    
    def _extract_individual_signs(self, soup, source_url: str, category: str) -> List[RoadSign]:
        """Extract individual signs not in tables."""
        signs = []
        
        # Look for div/section elements that might contain sign definitions
        for element in soup.find_all(['div', 'section', 'article']):
            # Look for elements with images and text that might be sign definitions
            images = element.find_all('img')
            if images:
                # Simple heuristic: if element has image and substantial text, might be a sign
                text = element.get_text(strip=True)
                if len(text) > 20:  # Has substantial text
                    sign = self._try_extract_sign_from_element(element, images[0], source_url, category)
                    if sign:
                        signs.append(sign)
        
        return signs
    
    def _try_extract_sign_from_element(self, element, img, source_url: str, category: str) -> Optional[RoadSign]:
        """Try to extract a sign from a generic element."""
        try:
            # Extract basic data
            image_url = img.get('src')
            if image_url and not image_url.startswith('http'):
                image_url = urljoin(source_url, image_url)
            
            sign_id = self._extract_sign_id(img, element)
            text = element.get_text(strip=True)
            
            # Use first line or sentence as name
            lines = text.split('\n')
            name = lines[0] if lines else text[:50]
            
            if sign_id and name:
                return RoadSign(
                    id=sign_id,
                    name=name,
                    category=category,
                    description=text if len(text) > len(name) else None,
                    image_url=image_url,
                    source_url=source_url
                )
        
        except Exception:
            pass
        
        return None
    
    def _download_images(self, signs: List[RoadSign], images_dir: Path) -> None:
        """Download all sign images."""
        ensure_directory(images_dir)
        
        downloaded = 0
        for sign in track(signs, description="Downloading images...", console=self.console):
            if sign.image_url:
                try:
                    # Get file extension from URL
                    parsed_url = urlparse(sign.image_url)
                    extension = Path(parsed_url.path).suffix or '.png'
                    
                    # Create filename - keep it simple and short
                    safe_name = sign.get_filename_safe_name()
                    
                    # If still too long, use just the sign ID
                    test_filename = f"{sign.id}_{safe_name}{extension}"
                    if len(test_filename) > 240:  # Conservative limit
                        filename = f"{sign.id}{extension}"
                    else:
                        filename = test_filename
                    
                    filepath = images_dir / filename
                    
                    # Download if not exists
                    if not filepath.exists():
                        response = self.session.get(sign.image_url)
                        response.raise_for_status()
                        
                        with open(filepath, 'wb') as f:
                            f.write(response.content)
                        
                        downloaded += 1
                    
                    # Update sign with local path
                    sign.image_file = str(filepath)
                    
                    time.sleep(0.5)  # Small delay between downloads
                    
                except Exception as e:
                    self.console.print(f"[yellow]⚠️ Failed to download {sign.image_url}: {e}[/yellow]")
                    continue
        
        self.console.print(f"[green]✓ Downloaded {downloaded} images[/green]")