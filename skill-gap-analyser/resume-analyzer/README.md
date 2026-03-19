# Resume Analyzer

A full-stack AI-powered resume analyzer built with React (Vite) + FastAPI.

**Security:** Do not commit real API keys. Use `backend/.env` and `frontend/.env` (both are in `.gitignore`). Copy from `.env.example` and rotate any keys that were ever committed.

## Stack
- **Frontend**: React, Vite, Tailwind CSS, Supabase JS, React Router, Axios
- **Backend**: FastAPI, Uvicorn, Google Generative AI (Gemini), Supabase

## Project Structure
```
resume-analyzer/
├── frontend/   # Vite + React app
└── backend/    # FastAPI app
```

## Getting Started

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # fill in your keys
npm run dev
```
