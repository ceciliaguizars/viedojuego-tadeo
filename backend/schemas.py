from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

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


def normalize_uuid(value: str) -> str:
    return str(UUID(value))


class SessionStartV2Request(SessionStartRequest):
    force_new: bool = False


class ProgressV2Request(BaseModel):
    current_screen: int = Field(ge=1, le=55)
    progress_revision: int = Field(ge=1)
    progress_snapshot: dict[str, Any]


class ResponseValueV2Request(BaseModel):
    field_id: str = Field(min_length=1, max_length=120)
    field_type: str = Field(min_length=1, max_length=40)
    literal_value: str
    order_index: int = Field(ge=0)
    validation_result: bool | None = None


class ResponseSubmissionV2Request(BaseModel):
    event_id: str = Field(min_length=8, max_length=64)
    situation: int = Field(ge=1, le=5)
    screen: int = Field(ge=1, le=55)
    activity_id: str = Field(min_length=1, max_length=120)
    validation_result: bool | None = None
    client_created_at: datetime | None = None
    order_index: int = Field(ge=0)
    values: list[ResponseValueV2Request] = Field(min_length=1)

    @field_validator("event_id")
    @classmethod
    def validate_event_id(cls, value: str) -> str:
        return normalize_uuid(value)


class ActivityV2Request(ActivityRequest):
    @field_validator("event_id")
    @classmethod
    def validate_event_id(cls, value: str) -> str:
        return normalize_uuid(value)


class CompleteV2Request(BaseModel):
    completion_event_id: str = Field(min_length=8, max_length=64)

    @field_validator("completion_event_id")
    @classmethod
    def validate_completion_event_id(cls, value: str) -> str:
        return normalize_uuid(value)


class ApplicationCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
