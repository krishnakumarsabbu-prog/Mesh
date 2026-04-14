from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.db.base import Base


class ProjectStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"
    ARCHIVED = "archived"


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    lob_id = Column(String, ForeignKey("lobs.id"), nullable=False)
    status = Column(SAEnum(ProjectStatus), default=ProjectStatus.ACTIVE)
    environment = Column(String, default="production")
    tags = Column(Text, nullable=True)
    color = Column(String, default="#30D158")
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lob = relationship("Lob", back_populates="projects")
    connectors = relationship("Connector", back_populates="project")
    health_checks = relationship("HealthCheck", back_populates="project")
