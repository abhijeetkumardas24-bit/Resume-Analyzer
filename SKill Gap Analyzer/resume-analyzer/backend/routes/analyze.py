from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel

from services import gemini_service, supabase_service
from auth import get_verified_user_id

router = APIRouter(prefix="/api")

class AnalysisRequest(BaseModel):
    pdf_base64: str
    target_role: str
    user_id: Optional[str] = None
    file_name: str
    job_description: Optional[str] = ""

# Server-side truncation to prevent prompt injection / oversized input
MAX_TARGET_ROLE_LEN = 200
MAX_JOB_DESC_LEN = 8000

# ── POST /api/analyze ──────────────────────────────────────────────
@router.post("/analyze")
async def analyze(req: AnalysisRequest, verified_user_id: Optional[str] = Depends(get_verified_user_id)):
    target_role = (req.target_role or "").strip()[:MAX_TARGET_ROLE_LEN]
    job_description = (req.job_description or "").strip()[:MAX_JOB_DESC_LEN]
    if not target_role:
        raise HTTPException(status_code=400, detail="target_role is required")
    # Basic server-side guard in case very large files slip past frontend checks
    # Decode once here so we can enforce a size limit and avoid sending
    # excessively large payloads to the Gemini API.
    MAX_PDF_BYTES = 5 * 1024 * 1024  # 5 MB
    try:
        # We reuse the internal decoding logic from the Gemini service by
        # calling a lightweight helper instead of duplicating code here.
        # If you ever adjust the limit, keep this in sync with the frontend.
        import base64

        pdf_bytes = base64.b64decode(req.pdf_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid PDF data. Please re-upload your file.")

    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=413,
            detail="PDF is too large. Please upload a file under 5 MB.",
        )

    # 1. Run Gemini analysis
    try:
        analysis = gemini_service.analyze_resume(
            pdf_base64=req.pdf_base64,
            target_role=target_role,
            job_description=job_description,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini analysis failed: {str(e)}")

    # Use JWT-verified user_id when present, else body user_id
    user_id = verified_user_id if verified_user_id is not None else req.user_id

    # 2. Persist to Supabase
    try:
        analysis_id = supabase_service.save_analysis(
            user_id=user_id,
            target_role=target_role,
            ats_score=analysis.get("ats_score", 0),
            analysis_json=analysis,
            file_name=req.file_name,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save analysis: {str(e)}")

    return {**analysis, "analysis_id": analysis_id}


# ── GET /api/analyses/{user_id} ────────────────────────────────────
@router.get("/analyses/{user_id}")
async def get_analyses(user_id: str, verified_user_id: Optional[str] = Depends(get_verified_user_id)):
    if verified_user_id is not None and verified_user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        return supabase_service.get_all_analyses(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /api/analyses/detail/{analysis_id} ─────────────────────────
@router.get("/analyses/detail/{analysis_id}")
async def get_analysis_detail(analysis_id: str, verified_user_id: Optional[str] = Depends(get_verified_user_id)):
    try:
        data = supabase_service.get_analysis_detail(analysis_id)
        if not data:
            raise HTTPException(status_code=404, detail="Analysis not found")
        if verified_user_id is not None and str(data.get("user_id")) != verified_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
