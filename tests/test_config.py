from backend.config import _normalize_database_url


def test_normalize_render_postgresql_url() -> None:
    assert (
        _normalize_database_url("postgresql://user:secret@host/database")
        == "postgresql+psycopg://user:secret@host/database"
    )


def test_normalize_legacy_postgres_url() -> None:
    assert (
        _normalize_database_url("postgres://user:secret@host/database")
        == "postgresql+psycopg://user:secret@host/database"
    )


def test_preserve_explicit_driver_or_sqlite_url() -> None:
    assert (
        _normalize_database_url("postgresql+psycopg://user:secret@host/database")
        == "postgresql+psycopg://user:secret@host/database"
    )
    assert _normalize_database_url("sqlite+pysqlite:///:memory:") == "sqlite+pysqlite:///:memory:"
