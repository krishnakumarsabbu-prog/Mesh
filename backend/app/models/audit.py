from sqlalchemy import Column, String, DateTime, Text, JSON
from datetime import datetime
import uuid
from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)
    resource_id = Column(String, nullable=True)
    changes = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    tenant_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
