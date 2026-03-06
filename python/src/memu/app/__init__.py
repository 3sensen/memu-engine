from typing import TYPE_CHECKING

from memu.app.settings import (
    BlobConfig,
    DatabaseConfig,
    DefaultUserModel,
    LLMConfig,
    LLMProfilesConfig,
    MemUConfig,
    MemorizeConfig,
    RetrieveConfig,
    UserConfig,
)
from memu.workflow.runner import (
    LocalWorkflowRunner,
    WorkflowRunner,
    register_workflow_runner,
    resolve_workflow_runner,
)

if TYPE_CHECKING:
    from memu.app.service import MemoryService as MemoryService


def __getattr__(name: str):
    if name == "MemoryService":
        from memu.app.service import MemoryService

        return MemoryService
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = [
    "BlobConfig",
    "DatabaseConfig",
    "DefaultUserModel",
    "LLMConfig",
    "LLMProfilesConfig",
    "LocalWorkflowRunner",
    "MemUConfig",
    "MemorizeConfig",
    "MemoryService",
    "RetrieveConfig",
    "UserConfig",
    "WorkflowRunner",
    "register_workflow_runner",
    "resolve_workflow_runner",
]
