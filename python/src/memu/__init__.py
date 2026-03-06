from __future__ import annotations

from typing import Callable

_hello_from_bin: Callable[[], str] | None = None
_core_import_error: Exception | None = None

try:
    from memu._core import hello_from_bin as _hello_from_bin
except Exception as exc:  # pragma: no cover - depends on local binary compatibility
    _core_import_error = exc

def _rust_entry() -> str:
    if _hello_from_bin is None:
        msg = (
            "memu._core is unavailable. The bundled binary extension is missing or "
            "incompatible with the current Python runtime."
        )
        raise RuntimeError(msg) from _core_import_error
    return _hello_from_bin()


__all__ = ["_rust_entry"]
