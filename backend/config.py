from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATABASE_URL = "postgresql+psycopg://tadeo:tadeo@127.0.0.1:5432/tadeo"


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "sí", "si", "on"}


def _project_path(value: str | None, default: Path) -> Path:
    path = Path(value).expanduser() if value else default
    return path if path.is_absolute() else PROJECT_ROOT / path


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
    admin_password_hash: str = os.getenv("ADMIN_PASSWORD_HASH", "")
    secret_key: str = os.getenv("SECRET_KEY", "development-only-change-me")
    cookie_secure: bool = _as_bool(os.getenv("COOKIE_SECURE"), False)
    stale_session_minutes: int = int(os.getenv("STALE_SESSION_MINUTES", "30"))
    host: str = os.getenv("HOST", "127.0.0.1")
    port: int = int(os.getenv("PORT", "4173"))
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    rag_model: str = os.getenv("RAG_MODEL", "gpt-5-mini")
    rag_embedding_model: str = os.getenv("RAG_EMBEDDING_MODEL", "text-embedding-3-small")
    rag_index_path: Path = _project_path(
        os.getenv("RAG_INDEX_PATH"), PROJECT_ROOT / "data" / "rag-index.json"
    )
    rag_top_k: int = int(os.getenv("RAG_TOP_K", "5"))

    @property
    def is_production_safe(self) -> bool:
        return (
            self.secret_key != "development-only-change-me"
            and bool(self.admin_password_hash)
            and self.cookie_secure
        )


settings = Settings()
