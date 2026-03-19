from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import gemini_service

router = APIRouter(prefix="/api")

class CareerDetectRequest(BaseModel):
    pdf_base64: str
    file_name: str

MAX_PDF_BYTES = 5 * 1024 * 1024

@router.post("/career-detect")
async def career_detect(req: CareerDetectRequest):
    import base64
    try:
        pdf_bytes = base64.b64decode(req.pdf_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid PDF data.")
    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=413, 
            detail="PDF too large. Max 5MB."
        )
    try:
        result = gemini_service.detect_careers(pdf_base64=req.pdf_base64)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Career detection failed: {str(e)}"
        )
    return result
