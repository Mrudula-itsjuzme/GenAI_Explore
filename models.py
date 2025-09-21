from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import json

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    display_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    settings = Column(JSON, default=lambda: {"honesty_mode": False})
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    journal_entries = relationship("JournalEntry", back_populates="user")
    art_pieces = relationship("Art", back_populates="owner")

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    mood_tag = Column(String(50), nullable=True)  # happy, sad, anxious, excited, etc.
    category = Column(String(50), default="general")  # general, rant, wishes, dreams, goals
    shared_anonymized = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="journal_entries")
    art_pieces = relationship("Art", back_populates="source_entry")

class Art(Base):
    __tablename__ = "art"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source_entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=False)
    art_url = Column(String(500), nullable=False)
    style = Column(String(100), nullable=True)  # abstract, realistic, dreamy, etc.
    shared_anonymized = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="art_pieces")
    source_entry = relationship("JournalEntry", back_populates="art_pieces")

class EmbeddingMetadata(Base):
    __tablename__ = "embedding_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=False)
    vector_id = Column(String(255), nullable=False)  # ID in Chroma vector DB
    mood_tag = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# Pydantic models for API
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserCreate(BaseModel):
    display_name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    display_name: str
    email: str
    settings: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True

class JournalEntryCreate(BaseModel):
    text: str
    mood_tag: Optional[str] = None
    category: Optional[str] = "general"  # general, rant, wishes, dreams, goals

class JournalEntryUpdate(BaseModel):
    text: Optional[str] = None
    mood_tag: Optional[str] = None
    category: Optional[str] = None
    shared_anonymized: Optional[bool] = None

class JournalEntryResponse(BaseModel):
    id: int
    text: str
    mood_tag: Optional[str]
    category: Optional[str] = "general"
    shared_anonymized: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    mode: str = "supportive"  # supportive, practical, honest

class ChatResponse(BaseModel):
    response: str
    context_used: List[str]  # snippets of journal entries used for context

class PlaylistRequest(BaseModel):
    mood_tag: str
    preferences: Optional[Dict[str, Any]] = None

class PlaylistResponse(BaseModel):
    playlist_name: str
    tracks: List[Dict[str, str]]  # [{name, artist, spotify_url}, ...]
    justification: str

class ArtRequest(BaseModel):
    entry_id: int
    style: str = "abstract"

class ArtResponse(BaseModel):
    id: int
    art_url: str
    style: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class CalendarResponse(BaseModel):
    daily_moods: Dict[str, str]  # {"2024-01-01": "happy", ...}
    mood_insights: Dict[str, int]  # {"happy": 5, "sad": 2, ...}

# Mood tags enum for consistency
MOOD_TAGS = [
    "happy", "sad", "anxious", "excited", "calm", "frustrated", 
    "grateful", "lonely", "confident", "overwhelmed", "peaceful", 
    "angry", "hopeful", "tired", "energetic", "content"
]