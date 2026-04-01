# 🧠 PrepMind AI

🚀 PrepMind AI is an offline-first adaptive learning platform that continues to function even when AI services fail.

## 1. Overview
PrepMind AI is an intelligent, offline-resilient, adaptive learning platform engineered to help students master complex subjects dynamically. Built with a modern React frontend and a robust Node.js backend, it serves as a personal AI tutor that tracks knowledge gaps, generates customized quizzes, and adjusting difficulty in real-time. Designed strictly for production-grade reliability, it ensures an uninterrupted learning experience even when external AI models face capacity limits.

## 🚨 Problem
Most AI learning platforms depend entirely on external APIs. When those APIs fail (rate limits, 503 errors), the entire system breaks — leading to poor user experience and loss of trust.

## ✅ Solution
PrepMind AI is built with a resilient architecture that:
- Handles API failures gracefully
- Provides intelligent offline fallback
- Maintains an uninterrupted learning experience

---

## 🔗 Live Demo
- **Frontend App:** [PrepMind AI on Vercel](https://prep-weblearning.vercel.app/)
- **Backend API:** [PrepMind AI Server on Render](https://prepmind-backend.onrender.com)

## 📸 Screenshots
*(Coming Soon)*
- 🎯 Quiz Interface & Adaptive Engine
- 📊 Dashboard Analytics & Weak Topic Modeling
- ⚠️ Graceful Offline Fallback Mode in Action

---

## 2. Key Features

**🤖 Dynamic AI Quiz Generation**
PrepMind leverages Large Language Models (LLMs) to construct structured, 5-question multiple-choice quizzes on the fly. It enforces strict JSON schemas to guarantee valid, context-aware question sets ranging from Easy to Hard.

**📈 Adaptive Learning Engine**
The platform doesn't just grade tests—it learns the user. By actively tracking correct vs. incorrect answers over time, the system calculates performance using the last 3 quiz attempts and dynamically adjusts difficulty (Easy → Medium → Hard).

**🧠 Local-First Memory System**
All learning history, topic breakdowns, and scores are safely merged and tracked offline using `localStorage`. This guarantees blazing-fast data retrieval, allowing users to pause, review, and retain their learning history independently of backend database connections.

**🎯 Weak Topic Detection**
PrepMind actively monitors gaps in the user's knowledge by calculating negative ratios (errors > correct answers) across specific subjects. These identified "Weak Topics" are silently injected into the AI generation prompt, directly forcing the LLM to target and strengthen the student's weaknesses in subsequent quizzes.

**📊 Smart Analytics Dashboard**
A clean, visual dashboard acts as the command center for the student. It renders score history graphs, isolates weak/strong subject recommendations, and generates a personalized "learning plan for today" based purely on historical offline telemetry.

**⏱️ Timer-Based Quizzes**
To simulate real exam environments, quizzes feature a strict per-question timer. If a student stalls, the system auto-submits, reveals the correct response and explanation, and advances the test, building critical time-management skills.

---

## 3. How It Works

1. **Focus Selection:** The student chooses a specific subject or exam (e.g., *Data Structures*, *AWS Cloud*).
2. **Contextual Generation:** The frontend queries the Node.js backend to generate a tailored quiz. The backend injects the student’s *Weak Topics* into the LLM prompt to heavily bias the generation toward areas needing improvement.
3. **Adaptive Testing:** The user takes the timer-bound quiz. Upon completion, the result is securely saved locally.
4. **Memory Evolution:** PrepMind recalculates the user's scaling statistics. If they ace the exam, the algorithm seamlessly upgrades their global difficulty to "Hard"; if they struggle, it dials back to "Medium" or "Easy".

---

## 4. What Makes It Unique: The Offline Resilience

Most AI wrappers break instantly when the underlying API hits a rate limit or a 503 Capacity outage. **PrepMind AI is built to survive.**

* **503 Retry Hooks:** If the Google Gemini servers declare `MODEL_CAPACITY_EXHAUSTED`, the backend intercepts the failure, applies a 1200ms sleep backoff, and attempts a native structural retry.
* **Intelligent Offline Fallbacks:** If the API completely drops, the system refuses to show a blank screen. It instantly pivots to a localized, offline-generator that produces fundamental placeholder questions, and deploys a lightweight rule-based offline assistant for generic queries.
* **UI Transparency:** The frontend detects this state and gracefully renders an amber badge: `⚠️ Showing offline questions (AI temporarily busy)`. The user's momentum is completely preserved.

---

## 5. Technical Highlights

* **Architecture:** React (Vite) + Node.js (Express).
* **Security:** **Zero API keys are exposed to the browser.** All LLM interactions securely tunnel through the Express backend.
* **Performance Optimizations:** The React frontend utilizes `AbortController` signal tracking and debounce techniques to categorically prevent duplicate API call spamming and race conditions. 
* **State Safety:** Legacy migrations and unbounded `localStorage` histories are strictly clamped (e.g., `MAX_HISTORY = 50`) using robust parsing bounds so the device memory never crashes or bloats.
* **Error Propagation:** The entire Express routing array is globally wrapped in uniform `try/catch` schemas returning standard `{ success: false, message: ... }` payloads, preventing unhandled promise rejections from crashing the server.

---

## 🧠 Key Learnings

- Handling real-world API failures (503, rate limits)
- Designing graceful fallback systems without breaking UX
- Building adaptive logic using simple data instead of heavy ML
- Ensuring offline-first reliability using localStorage
- Prioritizing user experience over perfect AI responses

---

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend   | Node.js + Express |
| AI Engine | Google Gemini 1.5 Flash |
| RAG       | In-memory vector search |

## Deployment Setup

### Backend → Render.com

1. Add Environment Variables in Render dashboard:
   - `GEMINI_API_KEY` = your key from Google AI Studio
   - `ALLOWED_ORIGINS` = your Vercel frontend URL 

### Frontend → Vercel

1. Import repo on Vercel
2. Add Environment Variable:
   - `VITE_API_URL` = your Render backend URL
