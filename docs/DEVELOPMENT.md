# Development Guide

## Project Structure

```
mudi-mental-health-companion/
├── backend/                 # FastAPI backend application
│   ├── main.py             # Main FastAPI app
│   ├── models.py           # Database models and Pydantic schemas
│   ├── database.py         # Database configuration
│   ├── auth.py             # Authentication utilities
│   ├── rag_service.py      # RAG and LLM integration
│   ├── playlist_service.py # Music playlist generation
│   ├── art_service.py      # Art generation service
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container configuration
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # Frontend container configuration
├── docs/                   # Documentation
├── data/                   # Persistent data storage
└── docker-compose.yml      # Multi-container orchestration
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git
- (Optional) Node.js 18+ and Python 3.11+ for local development

### Quick Start with Docker

1. **Clone the repository**:
   ```bash
   cd E:\mudi-mental-health-companion
   ```

2. **Create environment file** (optional):
   ```bash
   cp .env.example .env
   # Edit .env with your API keys if you have them
   ```

3. **Start the application**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development Setup

#### Backend Development

1. **Create virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the backend**:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Development

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Run the frontend**:
   ```bash
   npm run dev
   ```

## Core Features Implementation

### 1. Authentication & User Management

- JWT-based authentication
- User registration and login
- Protected routes and API endpoints

### 2. Journal System

- CRUD operations for journal entries
- Mood tagging system
- Text embeddings for RAG system

### 3. RAG-Based Chat Companion

- Vector database (Chroma) for storing entry embeddings
- Semantic search for relevant context
- LLM integration (OpenAI or local fallbacks)
- Safety checks and content moderation

### 4. Mood Calendar & Analytics

- Daily mood tracking
- Trend analysis and insights
- Visual calendar representation

### 5. Playlist Generation

- Mood-based music recommendations
- Spotify API integration (optional)
- Curated fallback playlists

### 6. Generative Art

- Text-to-image generation
- Style-based artistic interpretation
- Anonymous sharing system

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Journal
- `GET /journal` - List user's journal entries
- `POST /journal` - Create new entry
- `PUT /journal/{id}` - Update entry
- `DELETE /journal/{id}` - Delete entry

### AI Features
- `POST /chat` - Chat with AI companion
- `GET /calendar` - Get mood calendar data
- `POST /playlist` - Generate mood-based playlist
- `POST /art` - Generate art from journal entry
- `GET /art/wall` - Get shared art gallery

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | JWT signing key | Yes |
| `DATABASE_URL` | Database connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API access | No |
| `SPOTIFY_CLIENT_ID` | Spotify integration | No |
| `SPOTIFY_CLIENT_SECRET` | Spotify integration | No |

## Database Schema

### Users
- `id`, `display_name`, `email`, `hashed_password`
- `settings` (JSON): honesty_mode, preferences
- `created_at`

### JournalEntry
- `id`, `user_id`, `text`, `mood_tag`
- `shared_anonymized`, `created_at`, `updated_at`

### Art
- `id`, `owner_user_id`, `source_entry_id`
- `art_url`, `style`, `shared_anonymized`
- `created_at`

### EmbeddingMetadata
- `id`, `entry_id`, `vector_id`
- `mood_tag`, `created_at`

## Testing

### Backend Testing
```bash
cd backend
pytest
```

### Frontend Testing
```bash
cd frontend
npm test
```

## Deployment

### Production Build
```bash
# Build for production
docker-compose -f docker-compose.prod.yml up --build

# Or build individually
cd frontend && npm run build
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000
```

### Environment Configuration

For production deployment:
1. Set secure `SECRET_KEY`
2. Configure production database
3. Set up SSL/HTTPS
4. Configure environment-specific API keys
5. Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Privacy & Security Considerations

- All journal entries are private by default
- Optional anonymous sharing requires explicit consent
- No biometric or camera-based emotion detection
- Content moderation for safety
- GDPR-compliant data handling
- Secure authentication with JWT

## Troubleshooting

### Common Issues

1. **Docker containers not starting**:
   - Check if ports 3000 and 8000 are available
   - Verify Docker is running
   - Check logs: `docker-compose logs`

2. **Database connection errors**:
   - Ensure data directory has proper permissions
   - Check if SQLite file is created in `/data/`

3. **Frontend not connecting to backend**:
   - Verify backend is running on port 8000
   - Check CORS configuration in backend
   - Ensure API URL is correct in frontend environment

4. **AI features not working**:
   - AI features have graceful fallbacks when API keys are missing
   - Check console logs for specific errors
   - Verify internet connection for external APIs

### Getting Help

- Check the logs: `docker-compose logs [service-name]`
- Review the API documentation: http://localhost:8000/docs
- Check the issue tracker for known problems