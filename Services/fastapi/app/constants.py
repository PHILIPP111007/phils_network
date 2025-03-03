__all__ = ["DATETIME_FORMAT", "POSTS_TO_LOAD"]

from os import environ

DATETIME_FORMAT: str = environ.get("DATETIME_FORMAT", "%Y-%m-%d %H:%M")
POSTS_TO_LOAD: int = int(environ.get("POSTS_TO_LOAD", "20"))
