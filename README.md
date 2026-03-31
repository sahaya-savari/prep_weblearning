# PrepMind AI

An intelligent full-stack exam preparation platform powered by Google Gemini AI.

## Features
- 🤖 **AI Chat** — Ask doubts, get instant explanations
- 📝 **MCQ Practice** — AI-generated questions tailored to your exam
- 🎓 **Teach Mode** — Deep explanations on any topic
- 📚 **Learn Mode** — Structured syllabus-based learning
- 📁 **Knowledge Base** — Upload notes & ask questions from your documents (RAG)

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18 + Vite + TypeScript + Tailwind CSS + ShadCN UI |
| Backend   | Node.js + Express |
| AI Engine | Google Gemini 1.5 Flash |
| RAG       | In-memory vector search (cosine similarity) |

## Project Structure

```
PREP MIND/
├── backend/                # Express API server
│   ├── routes/             # API route handlers
│   ├── services/           # AI & RAG services
│   ├── utils/              # File parser & chunker
│   ├── server.js           # Main server entry
│   └── .env.example        # Environment variable template
├── prep-ai-tutor-main/     # React frontend
│   ├── src/
│   │   ├── pages/          # Route pages
│   │   ├── components/     # UI components
│   │   ├── services/       # API client
│   │   └── contexts/       # App state
│   └── vercel.json         # Vercel SPA config
└── render.yaml             # Render backend deploy config
```

## Local Development

### 1. Backend

```bash
cd backend
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm install
npm run dev
```

### 2. Frontend

```bash
cd prep-ai-tutor-main
cp .env.example .env
# .env already set to http://localhost:5000
npm install
npm run dev
```

## Deployment

### Backend → [Render.com](https://render.com)

1. Connect GitHub repo on Render
2. Render auto-detects `render.yaml` — select `prepmind-backend` service
3. Add Environment Variables in Render dashboard:
   - `GEMINI_API_KEY` = your key from [Google AI Studio](https://aistudio.google.com)
   - `ALLOWED_ORIGINS` = your Vercel frontend URL (e.g. `https://prep-weblearning.vercel.app`)

### Frontend → [Vercel](https://vercel.com)

1. Import repo on Vercel
2. Set **Root Directory** to `prep-ai-tutor-main`
3. Add Environment Variable:
   - `VITE_API_URL` = your Render backend URL (e.g. `https://prepmind-backend.onrender.com`)
4. Deploy

## Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key |
| `PORT` | No | Server port (default: 5000) |
| `ALLOWED_ORIGINS` | Prod only | Comma-separated frontend URLs |
| `OLLAMA_BASE_URL` | No | Ollama local fallback URL |
| `OLLAMA_MODEL` | No | Ollama model name (default: llama3) |

### Frontend (`prep-ai-tutor-main/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ Yes | Backend API base URL |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/chat` | AI chat conversation |
| POST | `/api/generate` | Generate MCQ questions |
| POST | `/api/teach` | Explain a topic |
| POST | `/api/upload` | Upload study document |
| POST | `/api/ask-docs` | Ask questions from uploaded docs |
