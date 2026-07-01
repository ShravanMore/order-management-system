from __future__ import annotations

from typing import Annotated
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_role
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse,
    EmployeeWorkloadResponse,
)
from app.services import employee_service

router = APIRouter(prefix="/employees", tags=["employees"])

# Admin only for all employee management endpoints
admin_required = Depends(require_role(UserRole.admin))


@router.get(
    "",
    response_model=EmployeeListResponse,
    summary="Get paginated list of employees (Admin Only)",
)
async def list_employees(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, description="Search by name or email"),
) -> EmployeeListResponse:
    """
    List all employees with pagination.
    Supports searching by name or email.
    """
    items, total_count = await employee_service.get_employees(
        db, page=page, page_size=page_size, search=search
    )
    return EmployeeListResponse(
        items=[EmployeeResponse.model_validate(item) for item in items],
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{id}",
    response_model=EmployeeResponse,
    summary="Get employee details by ID (Admin Only)",
)
async def get_employee(
    id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
) -> EmployeeResponse:
    """Get details of a specific employee."""
    employee = await employee_service.get_employee_by_id(db, employee_id=id)
    return EmployeeResponse.model_validate(employee)


@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new employee (Admin Only)",
)
async def create_employee(
    body: EmployeeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
) -> EmployeeResponse:
    """
    Create a new employee account.
    Password is hashed server-side before storing.
    """
    employee = await employee_service.create_employee(db, data=body)
    return EmployeeResponse.model_validate(employee)


@router.put(
    "/{id}",
    response_model=EmployeeResponse,
    summary="Update an employee (Admin Only)",
)
async def update_employee(
    id: int,
    body: EmployeeUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
) -> EmployeeResponse:
    """Update employee information."""
    employee = await employee_service.update_employee(db, employee_id=id, data=body)
    return EmployeeResponse.model_validate(employee)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate an employee (Admin Only)",
)
async def deactivate_employee(
    id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
) -> None:
    """
    Soft delete an employee by setting is_active=False.
    Prevents deactivation if employee has existing orders.
    """
    await employee_service.deactivate_employee(db, employee_id=id)


@router.get(
    "/{id}/workload",
    response_model=EmployeeWorkloadResponse,
    summary="Get employee workload statistics (Admin Only)",
)
async def get_employee_workload(
    id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
) -> EmployeeWorkloadResponse:
    """
    Get workload statistics for an employee.
    Returns counts of pending/ongoing/completed orders assigned to them.
    """
    workload = await employee_service.get_employee_workload(db, employee_id=id)
    return EmployeeWorkloadResponse(**workload)
