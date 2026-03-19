import os
import json
from supabase import create_client, Client

_client_singleton: Client | None = None

def _client() -> Client:
    global _client_singleton
    if _client_singleton is None:
        _client_singleton = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_KEY"],
        )
    return _client_singleton


def save_analysis(
    user_id: str,
    target_role: str,
    ats_score: int,
    analysis_json: dict,
    file_name: str,
) -> str:
    """
    Insert a row into `analyses` (and optionally `resumes`).
    Returns the new analysis_id (UUID string).
    """
    db = _client()

    try:
        result = (
            db.table("analyses")
            .insert({
                "user_id": user_id,
                "target_role": target_role,
                "ats_score": ats_score,
                "result": analysis_json,  # Pass dict directly for JSONB
                "file_name": file_name,
            })
            .execute()
        )

        if not result.data:
            raise Exception("No data returned from Supabase insert.")
            
        return result.data[0]["id"]
    except Exception as e:
        # Rethrow with more context if needed
        raise Exception(f"Supabase error: {str(e)}")


def save_message(user_id: str, analysis_id: str, role: str, content: str) -> None:
    """Insert a chat message row."""
    db = _client()
    db.table("chat_messages").insert({
        "user_id": user_id,
        "analysis_id": analysis_id,
        "role": role,
        "content": content,
    }).execute()


def get_chat_history(user_id: str, analysis_id: str) -> list:
    """Return all messages for a given analysis, oldest first."""
    db = _client()
    result = (
        db.table("chat_messages")
        .select("role, content, created_at")
        .eq("user_id", user_id)
        .eq("analysis_id", analysis_id)
        .order("created_at", desc=False)
        .execute()
    )
    return result.data


def delete_chat_history(user_id: str, analysis_id: str) -> None:
    """Delete all chat messages for a given analysis."""
    db = _client()
    (
        db.table("chat_messages")
        .delete()
        .eq("user_id", user_id)
        .eq("analysis_id", analysis_id)
        .execute()
    )


def get_all_analyses(user_id: str) -> list:
    """Return summary rows (id, target_role, ats_score, created_at) for a user."""
    db = _client()
    result = (
        db.table("analyses")
        .select("id, target_role, ats_score, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def get_analysis_detail(analysis_id: str) -> dict | None:
    """Return the full analyses row by id, or None if not found."""
    db = _client()
    result = (
        db.table("analyses")
        .select("*")
        .eq("id", analysis_id)
        .maybe_single()
        .execute()
    )
    return result.data
