import base64
import io

def extract_text_from_base64(pdf_base64: str) -> str:
    """
    Extract plain text from a base64-encoded PDF.
    Returns extracted text string.
    Raises ValueError if extraction fails or text is too short.
    """
    try:
        import pdfplumber
        pdf_bytes = base64.b64decode(pdf_base64)
        pdf_file = io.BytesIO(pdf_bytes)
        
        text_parts = []
        with pdfplumber.open(pdf_file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text.strip())
        
        full_text = "\n\n".join(text_parts).strip()
        
        if len(full_text) < 50:
            raise ValueError(
                "Could not extract enough text from PDF. "
                "Make sure your PDF is not scanned/image-based."
            )
        
        # Truncate to avoid oversized prompts (keep first 6000 chars)
        if len(full_text) > 6000:
            full_text = full_text[:6000] + "\n[Truncated for analysis]"
        
        return full_text
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"PDF text extraction failed: {str(e)}")
