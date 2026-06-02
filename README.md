# 🛍️ Spur Chatbot — AI Live Chat Support Agent

A full-stack AI-powered customer support chat widget for a fictional e-commerce store ("Spur Store"). Built with **SvelteKit** (frontend), **Node.js + TypeScript + Express** (backend), **SQLite via sql.js** (database), and **Groq** (LLM provider using `llama-3.3-70b-versatile`).

---

## 📋 Table of Contents

- [How to Run Locally](#how-to-run-locally)
- [Environment Variables](#environment-variables)
- [Architecture Overview](#architecture-overview)
- [LLM Notes](#llm-notes)
- [Data Model](#data-model)
- [Trade-offs & If I Had More Time](#trade-offs--if-i-had-more-time)

---

## 🚀 How to Run Locally

### Prerequisites

- **Node.js** v18+ (tested on v24)
- A **Groq API key** — get one free at [console.groq.com/keys](https://console.groq.com/keys)

### Step 1: Clone / Navigate to the project

```bash
cd spur_chatbot
```

### Step 2: Configure the Backend

```bash
cd backend

# Copy the env template and fill in your Groq API key
cp .env.example .env
# Then open .env and set GROQ_API_KEY=your_key_here

# Install dependencies
npm install
```

### Step 3: Start the Backend

```bash
# In the backend/ directory
npm run dev
```

The backend will start on **http://localhost:3001**. The SQLite database is created automatically at `backend/data/spur_chat.db` on first run — no migrations needed.

You should see:
```
[DB] Created new database at .../data/spur_chat.db
[DB] Schema initialized successfully
╔═══════════════════════════════════════════╗
║   Spur Chatbot Backend                    ║
║   Running on http://localhost:3001        ║
╚═══════════════════════════════════════════╝
```

### Step 4: Start the Frontend

In a **new terminal window**:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on **http://localhost:5173**.

### Step 5: Open the App

Go to **http://localhost:5173** in your browser. Click the chat button (bottom-right) and start chatting!

---

## 🔑 Environment Variables

Backend uses a `.env` file (never committed to git):

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | — | Your Groq API key |
| `PORT` | No | `3001` | Backend server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `DB_PATH` | No | `./data/spur_chat.db` | Path to SQLite DB file |

Copy `.env.example` → `.env` and set `GROQ_API_KEY`.

Frontend uses Vite environment variables (optional):

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001` | Backend API base URL |

---

## 🏗️ Architecture Overview

```
spur_chatbot/
├── backend/           # Node.js + TypeScript + Express
│   └── src/
│       ├── index.ts                  # App bootstrap & Express setup
│       ├── routes/chat.ts            # POST /api/chat/message, GET /api/chat/:id
│       ├── services/
│       │   ├── chatService.ts        # Orchestration (session + LLM)
│       │   ├── dbService.ts          # Data access layer (sql.js)
│       │   └── llmService.ts         # Groq API wrapper
│       ├── db/database.ts            # SQLite init & persistence
│       ├── middleware/validation.ts  # Zod request validation
│       └── types.ts                  # Shared TypeScript types
│
└── frontend/          # SvelteKit + Vanilla CSS
    └── src/
        ├── routes/+page.svelte       # Landing page
        ├── routes/+layout.svelte     # Global layout
        ├── lib/
        │   ├── ChatWidget.svelte     # Main chat UI (FAB + panel)
        │   ├── MessageBubble.svelte  # Individual message component
        │   └── api.ts                # Typed fetch wrappers
        └── app.css                   # Design system & global styles
```

### Backend Layers

1. **Route Layer** (`routes/`) — HTTP concerns: parsing, validation middleware, error mapping to HTTP status codes.
2. **Service Layer** (`services/`) — Business logic. Three focused services:
   - `chatService` — orchestrates the conversation flow
   - `dbService` — data access, decoupled from the HTTP layer
   - `llmService` — Groq API wrapper with system prompt and store knowledge
3. **Data Layer** (`db/`) — sql.js initialization and disk persistence

### Key Design Decisions

- **sql.js over better-sqlite3**: sql.js is a pure WASM port of SQLite requiring no native compilation. This makes setup trivial across all platforms without needing C++ build tools.
- **Session via UUID in localStorage**: No auth required. The frontend generates/stores a session ID in `localStorage`, enabling conversation persistence across page refreshes.
- **System prompt = knowledge base**: Store FAQ is hardcoded into the LLM system prompt. This is simple and reliable. An alternative (storing in DB) is noted in trade-offs.
- **Synchronous DB, async LLM**: sql.js is synchronous so DB calls have no async overhead. Only the Groq API call is async.

---

## 🤖 LLM Notes

### Provider
**Groq** using model `llama-3.3-70b-versatile`

Groq provides extremely fast inference (LPU architecture) and a free tier suitable for development. The model offers excellent instruction-following and conversational quality.

### Prompting Strategy

**System prompt structure:**
1. Role definition: "You are a friendly and professional AI support agent for Spur Store"
2. Behavioral constraints: "Keep answers clear, concise, and friendly. Don't make up information."
3. Inline FAQ knowledge base (shipping, returns, tracking, payment, support hours)

**Context window:** The last 20 messages from the conversation are included as history. This allows the AI to give contextual, coherent responses across multi-turn conversations.

**Token limits:**
- Max response: 512 tokens (~380 words) — sufficient for support answers, avoids runaway costs
- Max input message: 2,000 characters (server-side truncation with notice to user)

### Error Handling
LLM errors are caught and classified:
- Rate limit errors → friendly "high volume" message
- Timeout/network errors → friendly "timed out" message  
- API key errors → configuration error message
- Any other errors → generic "temporarily unavailable" message

All errors are surfaced in the chat UI rather than crashing or showing raw error messages.

---

## 🗃️ Data Model

### `conversations`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (UUID) | Primary key, used as `sessionId` |
| `created_at` | INTEGER | Unix timestamp (ms) |
| `metadata` | TEXT | JSON blob (reserved for future use) |

### `messages`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (UUID) | Primary key |
| `conversation_id` | TEXT | FK → conversations.id |
| `sender` | TEXT | `"user"` or `"ai"` |
| `text` | TEXT | Message content |
| `timestamp` | INTEGER | Unix timestamp (ms) |

### Indexes
- `idx_messages_conversation_id` — fast lookup of all messages for a session
- `idx_messages_timestamp` — chronological ordering

---

## ⚖️ Trade-offs & If I Had More Time

### Current Trade-offs

| Decision | Trade-off |
|---|---|
| sql.js (WASM SQLite) | No native compilation, but entire DB is loaded into memory. Fine for low-moderate traffic, but not ideal for large datasets. |
| FAQ hardcoded in system prompt | Simple and reliable, but requires code deploy to update. Could store in DB and query at runtime. |
| No auth | Per requirements. In production, would add session tokens or user accounts. |
| 512 max token response | Keeps costs low but very long answers get truncated. Could make this configurable. |
| Context window: 20 messages | Balances cost and coherence. Very long conversations lose early context. |

### If I Had More Time

- **Streaming responses**: Use Groq's streaming API to show the AI response word-by-word (much better UX)
- **FAQ stored in DB**: Seed FAQ entries in a `knowledge_base` table and include them dynamically. Allows non-developer updates.
- **Better-sqlite3 (production)**: For production, migrate to better-sqlite3 or PostgreSQL for proper multi-process support and better performance.
- **Redis caching**: Cache recent conversation history to avoid DB reads on every request.
- **Rate limiting**: Add `express-rate-limit` per IP to prevent abuse.
- **Conversation analytics**: Track common questions to improve the FAQ over time.
- **Multi-language support**: Groq's llama model handles multiple languages — could auto-detect and respond in kind.
- **File attachments**: Allow users to upload order confirmation images.
- **Human handoff**: When AI can't answer, offer to email a human agent.
- **Tests**: Unit tests for `chatService`, `llmService`, and `dbService`; integration tests for the API routes.
