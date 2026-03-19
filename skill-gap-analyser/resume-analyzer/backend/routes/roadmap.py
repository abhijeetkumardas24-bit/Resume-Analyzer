from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services import gemini_service
from auth import get_verified_user_id

router = APIRouter(prefix="/api/roadmap")

class RoadmapRequest(BaseModel):
    missing_skills: list
    target_role: str
    user_id: str

@router.post("")
async def create_roadmap(req: RoadmapRequest, verified_user_id: Optional[str] = Depends(get_verified_user_id)):
    if verified_user_id is not None and verified_user_id != req.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        roadmap = gemini_service.generate_roadmap(req.missing_skills, req.target_role)
        return roadmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
