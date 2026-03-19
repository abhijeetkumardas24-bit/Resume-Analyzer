import os
import json
import base64
import hashlib
import google.generativeai as genai
from utils.pdf_utils import extract_text_from_base64

# Simple in-memory cache: sha256(pdf_bytes) -> result dict
_analysis_cache: dict = {}
_career_cache: dict = {}

def _pdf_hash(pdf_base64: str) -> str:
    import base64 as _b64
    pdf_bytes = _b64.b64decode(pdf_base64)
    return hashlib.sha256(pdf_bytes).hexdigest()

def analyze_resume(pdf_base64: str, target_role: str, job_description: str = "") -> dict:
    """
    Send a PDF (base64-encoded) to Gemini 1.5 Flash and return structured
    ATS analysis as a Python dict.
    """
    cache_key = _pdf_hash(pdf_base64) + ":" + target_role[:50]
    if cache_key in _analysis_cache:
        return _analysis_cache[cache_key]

    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    # Gemini 1.5 Flash is no longer available for new projects.
    # Use a current Flash model instead (see https://ai.google.dev/gemini-api/docs/models).
    model = genai.GenerativeModel("gemini-2.5-flash")

    jd_block = (
        f"Compare against this job description:\n{job_description}\n"
        if job_description and job_description.strip()
        else ""
    )

    prompt = f"""You are an expert ATS resume analyzer and career coach.
Analyze this resume for the role of {target_role}.
{jd_block}
Return ONLY valid JSON. No markdown. No backticks. No extra text.
Exact structure:
{{
  "ats_score": <number 0-100>,
  "summary": "<2 sentence assessment>",
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "experience_feedback": "<string>",
  "education_feedback": "<string>",
  "formatting_issues": ["issue1", "issue2"],
  "keyword_suggestions": ["kw1", "kw2"],
  "rewritten_bullets": [
    {{"original": "<old>", "improved": "<new>"}}
  ],
  "top_3_priorities": ["p1", "p2", "p3"],
  "roadmap_90_days": [
    {{"phase": "Month 1: Fundamentals", "tasks": ["task1", "task2"], "resources": ["link1"]}},
    {{"phase": "Month 2: Specialization", "tasks": ["task3"], "resources": ["link2"]}},
    {{"phase": "Month 3: Capstone", "tasks": ["task4"], "resources": ["link3"]}}
  ],
  "score_by_category": {{
    "keywords": <number 0-100>,
    "experience": <number 0-100>,
    "education": <number 0-100>,
    "projects": <number 0-100>,
    "tools": <number 0-100>,
    "formatting": <number 0-100>
  }},
  "keyword_frequency": [
    {{"keyword": "string", "in_resume": <number>, "in_jd": <number>}}
  ],
  "radar_data": {{
    "programming": <number 0-100>,
    "cloud": <number 0-100>,
    "databases": <number 0-100>,
    "ml_ai": <number 0-100>,
    "pipelines": <number 0-100>,
    "visualization": <number 0-100>
  }},
  "strengths": ["string", "string", "string"],
  "weaknesses": ["string", "string", "string"],
  "recruiter_suggestion": "string",
  "recommended_certifications": ["string", "string", "string"],
  "recommended_internships": ["string", "string", "string"],
  "recommended_projects": ["string", "string", "string"],
  "action_items": [
    {{"title": "string", "description": "string"}},
    {{"title": "string", "description": "string"}},
    {{"title": "string", "description": "string"}}
  ]
}}
Rules for new fields:
- keyword_frequency: include 6-8 most important keywords from the target role. in_resume is how many times it appears in the resume (0 if not found). in_jd is importance score 1-10 for that role.
- radar_data: score each category 0-100 based on resume content
- strengths: exactly 3-4 items, specific to this resume
- weaknesses: exactly 3-4 items, specific to this resume  
- recruiter_suggestion: one paragraph of actionable advice
- recommended_certifications: exactly 3, relevant to target_role
- recommended_internships: exactly 3 job title suggestions
- recommended_projects: exactly 3 project ideas to build
- action_items: exactly 3 items with title (3-5 words) and description (1-2 sentences)
"""

    # Extract text from PDF first to reduce latency
    resume_text = extract_text_from_base64(pdf_base64)

    try:
        full_prompt = f"{prompt}\n\nRESUME TEXT:\n{resume_text}"
        response = model.generate_content(full_prompt)
        if not response or not response.text:
            raise ValueError("Gemini returned an empty response. This might be due to safety filters.")
        
        raw = response.text.strip()
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")

    # Robust JSON stripping
    if "```" in raw:
        parts = raw.split("```")
        for part in parts:
            if part.strip().startswith("{") or part.strip().startswith("["):
                raw = part.strip()
                if raw.startswith("json"):
                    raw = raw[4:].strip()
                break
    
    # Final cleanup of any potential prefix/suffix text
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1:
        raw = raw[start:end+1]

    try:
        result = json.loads(raw)
        _analysis_cache[cache_key] = result
        return result
    except json.JSONDecodeError as e:
        raise ValueError(f"Gemini returned invalid JSON structure. Error: {e}\nFull Response: {raw[:200]}...")

def chat_with_coach(message: str, resume_context: dict, chat_history: list) -> str:
    """
    Chat with Gemini as an expert career coach using the resume analysis context.
    """
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    system_instruction = f"""You are an expert career coach and resume advisor. 
You have analyzed the user's resume.

Analysis Data:
- ATS Score: {resume_context.get('ats_score', 'N/A')}
- Target Role: {resume_context.get('target_role', 'N/A')}
- Matched Skills: {resume_context.get('matched_skills', [])}
- Missing Skills: {resume_context.get('missing_skills', [])}
- Top 3 Priorities: {resume_context.get('top_3_priorities', [])}
- Experience Feedback: {resume_context.get('experience_feedback', '')}

Full analysis: {json.dumps(resume_context)}

Rules:
- Always reference their actual data, never generic
- Be direct, honest, and actionable
- Keep responses concise and practical
- If they ask what to learn: use their missing_skills
- If they ask about score: explain specifically why
- Always format responses using proper markdown
- Use ## for section headings
- Use - for bullet points (not *)
- Use **bold** only for important terms or role names
- Add a blank line between sections
- Keep responses well-structured and easy to read
- For roadmaps use ## Month 1, ## Month 2 etc as headings
- For resource links use [Resource Name](url) format"""

    model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_instruction)

    formatted_history = []
    for h in chat_history:
        formatted_history.append({
            "role": "user" if h["role"] == "user" else "model",
            "parts": [h["content"]]
        })

    chat = model.start_chat(history=formatted_history)
    response = chat.send_message(message)
    return response.text.strip()

def generate_roadmap(missing_skills: list, target_role: str) -> dict:
    """
    Generate a detailed 90-day learning roadmap using Gemini.
    """
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""Create a detailed 90-day learning roadmap for someone targeting {target_role} who is missing: {missing_skills}.

Return ONLY valid JSON. No markdown. No backticks:
{{
  "total_estimated_hours": number,
  "roadmap": [
    {{
      "week_range": "Week 1-2",
      "focus": "focus area title",
      "skills": ["skill1","skill2"],
      "resources": [
        {{
          "title": "name",
          "url": "https://...",
          "type": "Video/Course/Article/Docs",
          "free": true,
          "estimated_hours": number
        }}
      ],
      "milestone": "what you can do after this block"
    }}
  ]
}}
6-8 blocks. Prioritize free resources.
Min 2 free resources per block. Real URLs only."""

    response = model.generate_content(prompt)
    raw = response.text.strip()

    # Same robust JSON strip as analyze_resume() to avoid IndexError / JSON errors
    if "```" in raw:
        parts = raw.split("```")
        for part in parts:
            if part.strip().startswith("{") or part.strip().startswith("["):
                raw = part.strip()
                if raw.startswith("json"):
                    raw = raw[4:].strip()
                break
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1:
        raw = raw[start : end + 1]

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Roadmap JSON parse error: {e}\nRaw: {raw[:300]}...")

def detect_careers(pdf_base64: str) -> dict:
    """
    Analyze a resume PDF and return top 4 career role matches.
    """
    cache_key = _pdf_hash(pdf_base64)
    if cache_key in _career_cache:
        return _career_cache[cache_key]

    model = genai.GenerativeModel("gemini-2.5-flash")
    
    # Extract text from PDF first to reduce latency
    resume_text = extract_text_from_base64(pdf_base64)

    prompt = """You are an expert career counselor and resume analyst.
Analyze this resume carefully and identify the top 4 most suitable 
career roles for this person based on their skills, experience, 
education, and projects.

Return ONLY valid JSON. No markdown. No backticks. No extra text.
Exact structure:
{
  "extracted_skills": ["skill1", "skill2", "skill3"],
  "careers": [
    {
      "rank": 1,
      "role": "Role Title",
      "match_percentage": <number 0-100>,
      "explanation": "2-3 sentences explaining why this role fits based on specific skills and experience found in the resume",
      "missing_skills": ["skill1", "skill2", "skill3", "skill4"],
      "weeks_to_readiness": <number>,
      "accent_color": "#5eead4"
    },
    {
      "rank": 2,
      "role": "Role Title",
      "match_percentage": <number 0-100>,
      "explanation": "2-3 sentences",
      "missing_skills": ["skill1", "skill2", "skill3", "skill4"],
      "weeks_to_readiness": <number>,
      "accent_color": "#9b6fd4"
    },
    {
      "rank": 3,
      "role": "Role Title",
      "match_percentage": <number 0-100>,
      "explanation": "2-3 sentences",
      "missing_skills": ["skill1", "skill2", "skill3", "skill4"],
      "weeks_to_readiness": <number>,
      "accent_color": "#c9a84c"
    },
    {
      "rank": 4,
      "role": "Role Title",
      "match_percentage": <number 0-100>,
      "explanation": "2-3 sentences",
      "missing_skills": ["skill1", "skill2", "skill3", "skill4"],
      "weeks_to_readiness": <number>,
      "accent_color": "#f87171"
    }
  ]
}

Rules:
- extracted_skills: list 5-8 key skills actually found in the resume
- match_percentage: rank 1 should be highest, rank 4 lowest
- missing_skills: exactly 3-5 skills this person needs for that role
- weeks_to_readiness: realistic estimate (8-52 weeks)
- accent_color: use exactly the colors shown above per rank
- explanation must reference specific skills from the resume
- Return exactly 4 career objects, no more no less"""

    try:
        full_prompt = f"{prompt}\n\nRESUME TEXT:\n{resume_text}"
        response = model.generate_content(full_prompt)
        if not response or not response.text:
            raise ValueError("Empty response from Gemini")
        raw = response.text.strip()
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")

    if "```" in raw:
        parts = raw.split("```")
        for part in parts:
            if part.strip().startswith("{"):
                raw = part.strip()
                if raw.startswith("json"):
                    raw = raw[4:].strip()
                break

    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1:
        raw = raw[start:end+1]

    try:
        parsed_result = json.loads(raw)
        _career_cache[cache_key] = parsed_result
        return parsed_result
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON from Gemini: {e}\nRaw: {raw[:200]}")
