"""Console utilities for rich terminal output."""

from rich.console import Console

_console = None


def get_console() -> Console:
    """Get or create a shared Rich console instance."""
    global _console
    if _console is None:
        _console = Console()
    return _console