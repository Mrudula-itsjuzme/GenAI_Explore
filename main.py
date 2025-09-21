from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict
import os

from database import get_db, init_db
from models import *
from auth import get_current_user, authenticate_user, create_access_token, get_password_hash
from rag_service import RAGService
from playlist_service import PlaylistService
from art_service import ArtService

# Initialize FastAPI app
app = FastAPI(
    title="Mudi API",
    description="AI-Powered Mental Health Companion API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (for generated art)
if not os.path.exists("./static/art"):
    os.makedirs("./static/art", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize services
rag_service = RAGService()
playlist_service = PlaylistService()
art_service = ArtService()

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Health check
@app.get("/")
def health_check():
    return {"status": "healthy", "service": "Mudi API"}

# Authentication endpoints
@app.post("/auth/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        display_name=user_data.display_name,
        email=user_data.email,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": new_user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(new_user)
    }

@app.post("/auth/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return access token"""
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

@app.get("/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse.model_validate(current_user)

@app.put("/auth/settings")
def update_user_settings(
    settings: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user settings"""
    current_user.settings = {**current_user.settings, **settings}
    db.commit()
    db.refresh(current_user)
    return {"message": "Settings updated successfully", "settings": current_user.settings}

# Journal endpoints
@app.get("/journal", response_model=List[JournalEntryResponse])
def get_journal_entries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all journal entries for the current user"""
    entries = db.query(JournalEntry)\
        .filter(JournalEntry.user_id == current_user.id)\
        .order_by(JournalEntry.created_at.desc())\
        .all()
    
    return [JournalEntryResponse.model_validate(entry) for entry in entries]

@app.post("/journal", response_model=JournalEntryResponse)
async def create_journal_entry(
    entry_data: JournalEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new journal entry"""
    # Create journal entry
    new_entry = JournalEntry(
        user_id=current_user.id,
        text=entry_data.text,
        mood_tag=entry_data.mood_tag,
        category=entry_data.category or "general"
    )
    
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    
    # Add to RAG vector database asynchronously
    try:
        await rag_service.add_entry_to_vector_db(new_entry, db)
    except Exception as e:
        print(f"Error adding entry to vector DB: {e}")
    
    return JournalEntryResponse.model_validate(new_entry)

@app.put("/journal/{entry_id}", response_model=JournalEntryResponse)
def update_journal_entry(
    entry_id: int,
    entry_data: JournalEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a journal entry"""
    entry = db.query(JournalEntry)\
        .filter(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id)\
        .first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found"
        )
    
    # Update fields
    if entry_data.text is not None:
        entry.text = entry_data.text
    if entry_data.mood_tag is not None:
        entry.mood_tag = entry_data.mood_tag
    if entry_data.category is not None:
        entry.category = entry_data.category
    if entry_data.shared_anonymized is not None:
        entry.shared_anonymized = entry_data.shared_anonymized
    
    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    
    return JournalEntryResponse.model_validate(entry)

@app.delete("/journal/{entry_id}")
def delete_journal_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a journal entry"""
    entry = db.query(JournalEntry)\
        .filter(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id)\
        .first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found"
        )
    
    # TODO: Remove from vector DB as well
    db.delete(entry)
    db.commit()
    
    return {"message": "Journal entry deleted successfully"}

# Chat endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat_with_companion(
    chat_data: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat with AI companion using RAG"""
    try:
        response = await rag_service.get_companion_response(
            user_message=chat_data.message,
            user_id=current_user.id,
            mode=chat_data.mode,
            honesty_mode=current_user.settings.get("honesty_mode", False),
            db=db
        )
        return response
    except Exception as e:
        print(f"Chat error: {e}")
        # Fallback response
        return ChatResponse(
            response="I'm having trouble connecting right now. Please try again later.",
            context_used=[]
        )

# Calendar and insights endpoint
@app.get("/calendar", response_model=CalendarResponse)
def get_mood_calendar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get mood calendar data and insights"""
    # Get entries from the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    entries = db.query(JournalEntry)\
        .filter(
            JournalEntry.user_id == current_user.id,
            JournalEntry.created_at >= thirty_days_ago,
            JournalEntry.mood_tag.isnot(None)
        )\
        .all()
    
    # Build daily moods (most recent entry per day)
    daily_moods = {}
    mood_counts = {}
    
    for entry in entries:
        date_str = entry.created_at.strftime("%Y-%m-%d")
        if date_str not in daily_moods:
            daily_moods[date_str] = entry.mood_tag
        
        # Count mood frequency
        mood = entry.mood_tag
        mood_counts[mood] = mood_counts.get(mood, 0) + 1
    
    return CalendarResponse(
        daily_moods=daily_moods,
        mood_insights=mood_counts
    )

# Playlist endpoint
@app.post("/playlist", response_model=PlaylistResponse)
async def generate_playlist(
    playlist_data: PlaylistRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate mood-based playlist"""
    try:
        playlist = await playlist_service.generate_playlist(
            mood_tag=playlist_data.mood_tag,
            preferences=playlist_data.preferences
        )
        return playlist
    except Exception as e:
        print(f"Playlist generation error: {e}")
        # Return a fallback playlist
        return PlaylistResponse(
            playlist_name=f"Feeling {playlist_data.mood_tag.title()}",
            tracks=[],
            justification=f"A curated playlist for when you're feeling {playlist_data.mood_tag}."
        )

# Art generation endpoint
@app.post("/art", response_model=ArtResponse)
async def generate_art(
    art_data: ArtRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate art from journal entry"""
    # Get the journal entry
    entry = db.query(JournalEntry)\
        .filter(JournalEntry.id == art_data.entry_id, JournalEntry.user_id == current_user.id)\
        .first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found"
        )
    
    try:
        # Generate art
        art_url = await art_service.generate_art(
            text=entry.text,
            style=art_data.style,
            entry_id=entry.id
        )
        
        # Save art record
        new_art = Art(
            owner_user_id=current_user.id,
            source_entry_id=entry.id,
            art_url=art_url,
            style=art_data.style
        )
        
        db.add(new_art)
        db.commit()
        db.refresh(new_art)
        
        return ArtResponse.model_validate(new_art)
        
    except Exception as e:
        print(f"Art generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate art"
        )

# Art wall endpoint
@app.get("/art/wall")
def get_art_wall(db: Session = Depends(get_db)):
    """Get anonymized shared art"""
    art_pieces = db.query(Art)\
        .filter(Art.shared_anonymized == True)\
        .order_by(Art.created_at.desc())\
        .limit(20)\
        .all()
    
    return [
        {
            "id": art.id,
            "art_url": art.art_url,
            "style": art.style,
            "created_at": art.created_at
        }
        for art in art_pieces
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)