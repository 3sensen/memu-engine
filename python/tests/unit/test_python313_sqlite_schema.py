from __future__ import annotations

from pydantic import BaseModel
from sqlalchemy import MetaData
from sqlmodel import Session, create_engine

from memu.database.sqlite.models import SQLiteMemoryItemModel, build_sqlite_table_model


class ScopeModel(BaseModel):
    user_id: str = "default"
    agent_id: str = "main"


def test_scoped_sqlite_model_builds_on_current_python() -> None:
    metadata = MetaData()
    scoped_model = build_sqlite_table_model(
        ScopeModel,
        SQLiteMemoryItemModel,
        tablename="test_scoped_memory_items",
        metadata=metadata,
    )

    engine = create_engine("sqlite:///:memory:")
    metadata.create_all(engine)

    with Session(engine) as session:
        row = scoped_model(
            user_id="default",
            agent_id="main",
            memory_type="knowledge",
            summary="ok",
        )
        session.add(row)
        session.commit()

    assert "embedding_json" in scoped_model.model_fields
