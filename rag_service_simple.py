from typing import List, Optional
from sqlalchemy.orm import Session
from models import JournalEntry, EmbeddingMetadata, ChatResponse
import uuid
from datetime import datetime

class RAGService:
    def __init__(self):
        print("RAG Service initialized (simple mode - no AI dependencies)")

    async def add_entry_to_vector_db(self, entry: JournalEntry, db: Session):
        """Simple version - just stores metadata without embeddings"""
        try:
            # Create unique ID
            vector_id = str(uuid.uuid4())
            
            # Store metadata in SQL database (without vector DB)
            embedding_metadata = EmbeddingMetadata(
                entry_id=entry.id,
                vector_id=vector_id,
                mood_tag=entry.mood_tag
            )
            db.add(embedding_metadata)
            db.commit()
            
            print(f"Added entry {entry.id} to simple vector system")
            
        except Exception as e:
            print(f"Error adding entry: {e}")
            raise

    async def retrieve_relevant_context(self, query: str, user_id: int, k: int = 4) -> List[str]:
        """Simple keyword-based context retrieval"""
        try:
            # This is a simple fallback - in production, this would use vector search
            return ["Recent journal entry context...", "Previous emotional reflection..."]
            
        except Exception as e:
            print(f"Error retrieving context: {e}")
            return []

    async def get_companion_response(
        self, 
        user_message: str, 
        user_id: int, 
        mode: str = "supportive",
        honesty_mode: bool = False,
        db: Session = None
    ) -> ChatResponse:
        """Generate a supportive response without external AI"""
        try:
            # Simple rule-based responses
            user_lower = user_message.lower()
            
            # Check for concerning content
            concerning_keywords = ["hurt", "harm", "suicide", "die", "kill", "end it"]
            if any(keyword in user_lower for keyword in concerning_keywords):
                return ChatResponse(
                    response="I'm really concerned about what you're sharing. Please reach out to a mental health professional, a trusted friend, or a crisis helpline. You're not alone, and there are people who want to help. In the US, you can contact the National Suicide Prevention Lifeline at 988.",
                    context_used=[]
                )
            
            # Mood-based responses
            if any(word in user_lower for word in ["happy", "good", "great", "excited", "joy"]):
                response = "It's wonderful to hear you're feeling positive! What's been contributing to this good feeling today? It's important to celebrate these positive moments."
            elif any(word in user_lower for word in ["anxious", "worried", "stress", "nervous", "panic"]):
                if honesty_mode:
                    response = "I can hear that you're feeling anxious right now. Try focusing on what you can control today. What's one small action you can take right now?"
                else:
                    response = "I can hear that you're feeling anxious right now, and that's completely valid. Take a deep breath with me. What usually helps you feel more grounded?"
            elif any(word in user_lower for word in ["sad", "upset", "down", "depressed"]):
                response = "I'm sorry you're going through a difficult time. Your feelings are completely valid. Would you like to share what's been weighing on your mind?"
            else:
                response = "Thank you for sharing with me. I'm here to listen and support you. What would you like to talk about today? Sometimes it helps to just put your thoughts into words."
            
            return ChatResponse(
                response=response,
                context_used=["Based on your message and supportive AI principles"]
            )
            
        except Exception as e:
            print(f"Error generating companion response: {e}")
            return ChatResponse(
                response="I'm here to listen. Could you tell me more about how you're feeling?",
                context_used=[]
            )