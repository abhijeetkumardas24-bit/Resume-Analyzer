from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services import gemini_service, supabase_service
from auth import get_verified_user_id

router = APIRouter(prefix="/api")


class ChatRequest(BaseModel):
    message: str
    analysis_id: str
    user_id: str
    resume_context: dict


# ── POST /api/chat ────────────────────────────────────────────────
@router.post("/chat")
async def chat(req: ChatRequest, verified_user_id: Optional[str] = Depends(get_verified_user_id)):
    user_id = verified_user_id if verified_user_id is not None else req.user_id
    if verified_user_id is not None and verified_user_id != req.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        # 1. Fetch history
        history = supabase_service.get_chat_history(user_id, req.analysis_id)

        # 2. Call Gemini
        reply = gemini_service.chat_with_coach(
            message=req.message,
            resume_context=req.resume_context,
            chat_history=history,
        )

        # 3. Save user message
        supabase_service.save_message(user_id, req.analysis_id, "user", req.message)

        # 4. Save assistant reply
        supabase_service.save_message(user_id, req.analysis_id, "assistant", reply)

        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /api/chat/history/{analysis_id}/{user_id} ─────────────────
@router.get("/chat/history/{analysis_id}/{user_id}")
async def get_chat_history(analysis_id: str, user_id: str, verified_user_id: Optional[str] = Depends(get_verified_user_id)):
    if verified_user_id is not None and verified_user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        messages = supabase_service.get_chat_history(user_id, analysis_id)
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── DELETE /api/chat/history/{analysis_id}/{user_id} ──────────────
@router.delete("/chat/history/{analysis_id}/{user_id}")
async def delete_chat_history(analysis_id: str, user_id: str, verified_user_id: Optional[str] = Depends(get_verified_user_id)):
    if verified_user_id is not None and verified_user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        supabase_service.delete_chat_history(user_id, analysis_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
