from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.project import ProjectStatus


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    environment: Optional[str] = "production"
    tags: Optional[str] = None
    color: Optional[str] = "#30D158"


class ProjectCreate(ProjectBase):
    slug: str
    lob_id: str


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    environment: Optional[str] = None
    tags: Optional[str] = None
    color: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: str
    slug: str
    lob_id: str
    status: ProjectStatus
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    connector_count: Optional[int] = 0
    healthy_count: Optional[int] = 0
    degraded_count: Optional[int] = 0
    down_count: Optional[int] = 0

    class Config:
        from_attributes = True
