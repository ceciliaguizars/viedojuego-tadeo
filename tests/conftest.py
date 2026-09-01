from __future__ import annotations

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-not-for-production"

import pytest
from fastapi.testclient import TestClient

from backend.database import Base, SessionLocal, engine
from backend.main import app
from backend.models import Application, ParticipantCode


@pytest.fixture(autouse=True)
def clean_database():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def participant_code() -> str:
    with SessionLocal() as database:
        application = Application(name="Aplicación de prueba")
        database.add(application)
        database.flush()
        code = ParticipantCode(application_id=application.id, code="TEST2345")
        database.add(code)
        database.commit()
    return "TEST2345"

