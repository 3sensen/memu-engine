"""Storage backends for MemU."""

from typing import TYPE_CHECKING

from memu.database.interfaces import (
    CategoryItemRecord,
    Database,
    MemoryCategoryRecord,
    MemoryItemRecord,
    ResourceRecord,
)
from memu.database.repositories import CategoryItemRepo, MemoryCategoryRepo, MemoryItemRepo, ResourceRepo

if TYPE_CHECKING:
    from memu.database.factory import build_database as build_database


def __getattr__(name: str):
    if name == "build_database":
        from memu.database.factory import build_database

        return build_database
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = [
    "CategoryItemRecord",
    "CategoryItemRepo",
    "Database",
    "MemoryCategoryRecord",
    "MemoryCategoryRepo",
    "MemoryItemRecord",
    "MemoryItemRepo",
    "ResourceRecord",
    "ResourceRepo",
    "build_database",
    "inmemory",
    "postgres",
    "schema",
    "sqlite",
]
