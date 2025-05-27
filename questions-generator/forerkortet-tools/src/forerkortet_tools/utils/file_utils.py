"""File system utilities."""

from pathlib import Path
from typing import List, Union


def ensure_directory(directory: Union[str, Path]) -> Path:
    """Ensure a directory exists, creating it if necessary.
    
    Args:
        directory: Path to the directory
        
    Returns:
        Path object for the directory
    """
    path = Path(directory)
    path.mkdir(parents=True, exist_ok=True)
    return path


def find_files_by_pattern(
    directory: Union[str, Path], 
    pattern: str,
    recursive: bool = True
) -> List[Path]:
    """Find files matching a pattern in a directory.
    
    Args:
        directory: Directory to search in
        pattern: Glob pattern to match
        recursive: Whether to search recursively
        
    Returns:
        List of matching file paths
    """
    path = Path(directory)
    if recursive:
        return sorted(path.rglob(pattern))
    return sorted(path.glob(pattern))