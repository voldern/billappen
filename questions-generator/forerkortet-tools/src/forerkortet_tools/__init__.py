"""Forerkortet Tools - Consolidated tools for Norwegian driving license quiz generation."""

__version__ = "0.1.0"
__author__ = "Espen"

# Re-export main components for easier access
from .html_converter import HTMLToMarkdownConverter
from .road_signs import RoadSignsScraper
from .question_generator import QuestionGenerator

__all__ = ["HTMLToMarkdownConverter", "RoadSignsScraper", "QuestionGenerator"]