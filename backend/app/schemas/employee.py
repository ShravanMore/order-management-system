from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class EmployeeBase(BaseModel):
    full_name: str = Field(..., max_length=255, min_length=1)
    email: str = Field(..., max_length=320)  # String to allow local domains like .local
    phone: str | None = Field(None, max_length=20)
    avatar_url: str | None = Field(None, max_length=1024)
    
    @field_validator("email")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        """Normalize email to lowercase and strip whitespace."""
        return v.strip().lower()


class EmployeeCreate(EmployeeBase):
    password: str = Field(..., min_length=8, max_length=128)


class EmployeeUpdate(BaseModel):
    full_name: str | None = Field(None, max_length=255, min_length=1)
    email: str | None = Field(None, max_length=320)
    phone: str | None = Field(None, max_length=20)
    avatar_url: str | None = Field(None, max_length=1024)
    
    @field_validator("email")
    @classmethod
    def normalise_email(cls, v: str | None) -> str | None:
        """Normalize email to lowercase and strip whitespace."""
        if v is None:
            return None
        return v.strip().lower()


class EmployeeResponse(EmployeeBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmployeeListResponse(BaseModel):
    items: list[EmployeeResponse]
    total_count: int
    page: int
    page_size: int


class EmployeeWorkloadResponse(BaseModel):
    employee_id: int
    employee_name: str
    pending_orders: int
    ongoing_orders: int
    completed_orders: int
    total_assigned_orders: int
