from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import get_db
from app.schemas.health import ChatRequest, ChatResponse
from app.services.chatbot_service import chatbot_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/message", response_model=ChatResponse)
async def send_message(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await chatbot_service.process_message(db, data, tenant_id=current_user.tenant_id or "default")
