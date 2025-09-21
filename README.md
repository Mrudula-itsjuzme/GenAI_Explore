# Mudi - AI-Powered Mental Health Companion

Mudi is a comprehensive mental health companion application that combines journaling, AI-powered chat support, mood tracking, playlist generation, and generative art creation to support users' emotional well-being.

## Features (MVP)

1. **Journal (CRUD + mood tag)** — Write, edit, delete entries with optional mood tagging
2. **Chatbot companion (RAG-grounded)** — LLM answers grounded by your recent journal entries
3. **Mood Calendar + Insights** — Daily mood visualization with analytics
4. **Playlist generator** — Mood-based playlist recommendations
5. **Generative Art Wall** — Create and share anonymous art from journal entries

## Architecture

```
User (browser) ⇄ React UI ⇄ FastAPI ⇄ {SQLite DB, Chroma Vector DB, Object Storage, LLM/Embedding Service, Spotify API}
```

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + Recharts
- **Backend**: FastAPI (Python)
- **Database**: SQLite (journal entries) + Chroma (vector embeddings)
- **AI/ML**: Sentence Transformers (embeddings) + OpenAI/Gemini (LLM)
- **Art Generation**: Stable Diffusion (Diffusers)
- **Development**: Docker + docker-compose

## Quick Start

1. **Clone and setup**:
   ```bash
   cd E:\mudi-mental-health-companion
   docker-compose up --build
   ```

2. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Data Model

### User
- `id`, `display_name`, `email`, `settings` (honesty_mode: bool)

### JournalEntry
- `id`, `user_id`, `text`, `mood_tag`, `created_at`, `shared_anonymized`

### Art
- `id`, `owner_user_id`, `source_entry_id`, `art_url`, `style`, `shared_anonymized`

## API Endpoints

- `POST /auth/login` - Authentication
- `GET/POST /journal` - Journal CRUD operations
- `GET /calendar` - Mood calendar data
- `POST /chat` - AI companion chat
- `POST /playlist` - Generate mood-based playlists
- `POST /art` - Generate art from entries
- `GET /art/wall` - Anonymous art sharing

## Privacy & Safety

- Entries are private by default
- Sharing is explicit and anonymized
- Text-only mood inference (no camera/biometric data)
- Built-in content moderation and safety filters
- GDPR-compliant data export and deletion

## Development

See `docs/DEVELOPMENT.md` for detailed setup instructions and development workflow.

## Demo

See `docs/DEMO.md` for demo script and usage examples.

---

*Built for mental health awareness and support. Not a replacement for professional medical advice.*