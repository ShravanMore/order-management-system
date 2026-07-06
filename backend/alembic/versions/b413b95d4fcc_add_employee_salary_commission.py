"""add_employee_salary_commission

Revision ID: b413b95d4fcc
Revises: 72d9252945bf
Create Date: 2026-07-06 12:30:40.944472

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b413b95d4fcc'
down_revision: Union[str, None] = '72d9252945bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add base_salary column
    op.add_column(
        'users',
        sa.Column('base_salary', sa.Numeric(precision=12, scale=2), nullable=True, comment='Monthly base salary in ₹')
    )
    
    # Add commission_percentage column with default value of 1.00
    op.add_column(
        'users',
        sa.Column('commission_percentage', sa.Numeric(precision=5, scale=2), nullable=True, comment='Commission % on completed orders')
    )


def downgrade() -> None:
    op.drop_column('users', 'commission_percentage')
    op.drop_column('users', 'base_salary')
