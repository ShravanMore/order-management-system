from sqlalchemy.orm import DeclarativeBase, declared_attr


class Base(DeclarativeBase):
    """
    Shared declarative base for all SQLAlchemy models.

    Subclasses automatically get a __tablename__ derived from the class name
    (snake_case plural handled per-model), plus the standard metadata registry.
    """

    @declared_attr.directive
    def __tablename__(cls) -> str:  # noqa: N805
        # Simple snake_case conversion; individual models can override.
        import re
        name = re.sub(r"(?<!^)(?=[A-Z])", "_", cls.__name__).lower()
        return f"{name}s"
