from __future__ import annotations

import builtins
import importlib
import sys

import pytest


def test_memu_import_tolerates_incompatible_core(monkeypatch: pytest.MonkeyPatch) -> None:
    original_import = builtins.__import__

    def fake_import(name, globals=None, locals=None, fromlist=(), level=0):
        if name == "memu._core":
            raise ImportError("simulated ABI mismatch")
        return original_import(name, globals, locals, fromlist, level)

    monkeypatch.setattr(builtins, "__import__", fake_import)
    sys.modules.pop("memu", None)
    sys.modules.pop("memu._core", None)

    memu = importlib.import_module("memu")

    with pytest.raises(RuntimeError, match="memu\\._core is unavailable"):
        memu._rust_entry()

