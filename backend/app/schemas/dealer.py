from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field, EmailStr


class DealerBase(BaseModel):
    name: str = Field(..., max_length=255, min_length=1)
    contact_person: str = Field(..., max_length=255, min_length=1)
    email: str = Field(..., max_length=320)  # String to allow local domains comfortably
    phone: str = Field(..., max_length=20, min_length=1)
    address: str = Field(..., max_length=500, min_length=1)
    city: str = Field(..., max_length=100, min_length=1)
    state: str = Field(..., max_length=100, min_length=1)
    pincode: str = Field(..., max_length=10, min_length=1)
    gst_number: str | None = Field(None, max_length=15)


class DealerCreate(DealerBase):
    pass


class DealerUpdate(BaseModel):
    name: str | None = Field(None, max_length=255, min_length=1)
    contact_person: str | None = Field(None, max_length=255, min_length=1)
    email: str | None = Field(None, max_length=320)
    phone: str | None = Field(None, max_length=20, min_length=1)
    address: str | None = Field(None, max_length=500, min_length=1)
    city: str | None = Field(None, max_length=100, min_length=1)
    state: str | None = Field(None, max_length=100, min_length=1)
    pincode: str | None = Field(None, max_length=10, min_length=1)
    gst_number: str | None = Field(None, max_length=15)


class DealerResponse(DealerBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DealerListResponse(BaseModel):
    items: list[DealerResponse]
    total_count: int
    page: int
    page_size: int
