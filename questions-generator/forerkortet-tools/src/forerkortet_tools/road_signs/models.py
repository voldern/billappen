"""Data models for road signs scraper."""

import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, HttpUrl


class RoadSign(BaseModel):
    """Individual road sign data."""
    
    id: str = Field(..., description="Sign ID/number")
    name: str = Field(..., description="Sign name/title")
    category: str = Field(..., description="Sign category (e.g., Fareskilt)")
    description: Optional[str] = Field(None, description="Detailed description")
    image_url: Optional[str] = Field(None, description="URL to sign image")
    image_file: Optional[str] = Field(None, description="Local path to downloaded image")
    source_url: Optional[str] = Field(None, description="Source URL where sign was found")
    lovdata_reference: Optional[str] = Field(None, description="Legal reference (e.g., § 5-1)")
    regulation_text: Optional[str] = Field(None, description="Legal regulation text")
    
    def get_filename_safe_name(self) -> str:
        """Get a filename-safe version of the sign name."""
        # Remove/replace invalid characters
        safe_name = re.sub(r'[<>:"/\\|?*]', '_', self.name)
        safe_name = re.sub(r'\s+', '_', safe_name)
        
        # Truncate to reasonable length (leaving room for ID and extension)
        # Max filename length is usually 255, so we use 200 to be safe
        max_length = 200
        if len(safe_name) > max_length:
            safe_name = safe_name[:max_length].rstrip('_')
        
        return safe_name


class SignCategory(BaseModel):
    """Category of road signs."""
    
    name: str = Field(..., description="Category name")
    url: str = Field(..., description="URL to category page")
    sign_count: Optional[int] = Field(None, description="Number of signs in category")


class ScrapingSession(BaseModel):
    """Complete scraping session data."""
    
    signs: List[RoadSign] = Field(default_factory=list)
    categories: List[SignCategory] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    duplicate_count: int = Field(default=0, exclude=True)  # Track duplicates, exclude from export
    
    def add_sign(self, sign: RoadSign) -> None:
        """Add a sign to the session, avoiding duplicates."""
        # Check if a sign with the same ID AND name already exists
        # This handles cases where the same sign appears on multiple pages
        existing_sign = next(
            (s for s in self.signs if s.id == sign.id and s.name == sign.name), 
            None
        )
        
        if existing_sign:
            # Track that we found a duplicate
            self.duplicate_count += 1
            
            # If sign exists, update it with better information
            # Update description if new one is longer/better
            if sign.description and (
                not existing_sign.description or 
                len(sign.description) > len(existing_sign.description)
            ):
                existing_sign.description = sign.description
            
            # Update other fields if they're missing in existing sign
            if not existing_sign.image_url and sign.image_url:
                existing_sign.image_url = sign.image_url
            if not existing_sign.image_file and sign.image_file:
                existing_sign.image_file = sign.image_file
            if not existing_sign.regulation_text and sign.regulation_text:
                existing_sign.regulation_text = sign.regulation_text
            if not existing_sign.lovdata_reference and sign.lovdata_reference:
                existing_sign.lovdata_reference = sign.lovdata_reference
            # Don't add duplicate, just update existing
        else:
            # Check if we have a sign with same ID but different name
            # This could be a legitimate different variant
            same_id_different_name = next(
                (s for s in self.signs if s.id == sign.id and s.name != sign.name),
                None
            )
            if same_id_different_name:
                # Log this as it might be interesting
                # but still add it as it's a different sign variant
                pass
            
            # Sign doesn't exist, add it
            self.signs.append(sign)
    
    def get_signs_by_category(self, category: str) -> List[RoadSign]:
        """Get signs filtered by category."""
        return [sign for sign in self.signs if sign.category.lower() == category.lower()]
    
    def get_categories(self) -> List[str]:
        """Get unique categories."""
        return list(set(sign.category for sign in self.signs))
    
    def to_export_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format for JSON export."""
        return {
            "signs": [sign.model_dump() for sign in self.signs],
            "metadata": {
                **self.metadata,
                "total_signs": len(self.signs),
                "duplicates_prevented": self.duplicate_count,
                "categories": self.get_categories(),
                "scraped_at": datetime.now().isoformat()
            }
        }