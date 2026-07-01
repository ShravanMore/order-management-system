from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator


class EmployeeBase(BaseModel):
    full_name: str = Field(..., max_length=255, min_length=1)
    email: EmailStr
    phone: str | None = Field(None, max_length=20)
    avatar_url: str | None = Field(None, max_length=1024)


class EmployeeCreate(EmployeeBase):
    password: str = Field(..., min_length=8, max_length=128)


class EmployeeUpdate(BaseModel):
    full_name: str | None = Field(None, max_length=255, min_length=1)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=20)
    avatar_url: str | None = Field(None, max_length=1024)


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
