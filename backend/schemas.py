from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator


class SessionStartRequest(BaseModel):
    code: str = Field(min_length=1, max_length=32)
    resume_session_id: str | None = None
    resume_token: str | None = None

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper().replace(" ", "")


class AttemptRequest(BaseModel):
    event_id: str = Field(min_length=8, max_length=64)
    scene_index: int = Field(ge=0, le=4)
    step_index: int = Field(ge=0, le=4)
    answers: dict[str, Any]


class ActivityRequest(BaseModel):
    event_id: str = Field(min_length=8, max_length=64)
    active_seconds: float = Field(gt=0, le=120)


class ApplicationCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
