import os
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List, Optional
from sqlalchemy.orm import Session
from models import JournalEntry, EmbeddingMetadata, ChatResponse
# import openai  # Will import dynamically when needed
from datetime import datetime, timedelta
import uuid

class RAGService:
    def __init__(self):
        # Initialize embedding model
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize Chroma DB
        self.chroma_client = chromadb.PersistentClient(path="./data/chroma_db")
        
        # Get or create collection
        self.collection = self.chroma_client.get_or_create_collection(
            name="journal_entries",
            metadata={"hnsw:space": "cosine"}
        )
        
        # Initialize OpenAI client (optional)
        self.openai_client = None
        if os.getenv("OPENAI_API_KEY"):
            self.openai_client = True  # Just flag that we have an API key
        
        # System prompt template
        self.system_prompt = """You are Mudi, a friendly adolescent companion designed to support mental health and emotional well-being. 

Core Guidelines:
- Always validate feelings and show empathy
- Offer one supportive sentence and one practical suggestion
- Use the provided context from the user's journal entries to ground your responses
- Be conversational and warm, like talking to a close friend
- Never provide medical advice or diagnose conditions
- If content indicates self-harm, respond with care and suggest professional help

Context Mode: {honesty_mode_text}

Recent Journal Context:
{context}

Remember: You are a supportive companion, not a therapist. Your role is to listen, validate, and offer gentle guidance based on the user's own reflections."""

    async def add_entry_to_vector_db(self, entry: JournalEntry, db: Session):
        """Add a journal entry to the vector database"""
        try:
            # Generate embedding
            embedding = self.embedding_model.encode(entry.text)
            
            # Create unique ID
            vector_id = str(uuid.uuid4())
            
            # Add to Chroma collection
            self.collection.add(
                embeddings=[embedding.tolist()],
                documents=[entry.text],
                metadatas=[{
                    "entry_id": entry.id,
                    "user_id": entry.user_id,
                    "mood_tag": entry.mood_tag or "",
                    "created_at": entry.created_at.isoformat()
                }],
                ids=[vector_id]
            )
            
            # Store metadata in SQL database
            embedding_metadata = EmbeddingMetadata(
                entry_id=entry.id,
                vector_id=vector_id,
                mood_tag=entry.mood_tag
            )
            db.add(embedding_metadata)
            db.commit()
            
            print(f"Added entry {entry.id} to vector database")
            
        except Exception as e:
            print(f"Error adding entry to vector DB: {e}")
            raise

    async def retrieve_relevant_context(self, query: str, user_id: int, k: int = 4) -> List[str]:
        """Retrieve relevant journal entries for the given query"""
        try:
            # Generate embedding for the query
            query_embedding = self.embedding_model.encode(query)
            
            # Search in Chroma
            results = self.collection.query(
                query_embeddings=[query_embedding.tolist()],
                n_results=k,
                where={"user_id": user_id}
            )
            
            # Format results
            context_snippets = []
            if results["documents"]:
                for i, doc in enumerate(results["documents"][0]):
                    metadata = results["metadatas"][0][i]
                    created_at = metadata.get("created_at", "")
                    mood = metadata.get("mood_tag", "")
                    
                    # Create a snippet
                    snippet = f"[{created_at[:10]}] {doc[:200]}..."
                    if mood:
                        snippet = f"[{created_at[:10]}, feeling {mood}] {doc[:200]}..."
                    
                    context_snippets.append(snippet)
            
            return context_snippets
            
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
        """Generate AI companion response using RAG"""
        try:
            # Retrieve relevant context
            context_snippets = await self.retrieve_relevant_context(user_message, user_id)
            
            # Format context
            context_text = "\n".join(context_snippets) if context_snippets else "No previous journal entries found."
            
            # Determine honesty mode text
            honesty_mode_text = "Be practical and direct in your responses." if honesty_mode else "Be gentle and supportive in your responses."
            
            # Build system prompt
            system_prompt = self.system_prompt.format(
                context=context_text,
                honesty_mode_text=honesty_mode_text
            )
            
            # Generate response using OpenAI or fallback
            if self.openai_client:
                response_text = await self._generate_openai_response(system_prompt, user_message)
            else:
                response_text = await self._generate_fallback_response(user_message, context_snippets, honesty_mode)
            
            return ChatResponse(
                response=response_text,
                context_used=[snippet[:100] + "..." for snippet in context_snippets[:3]]
            )
            
        except Exception as e:
            print(f"Error generating companion response: {e}")
            return ChatResponse(
                response="I'm here to listen. Could you tell me more about how you're feeling?",
                context_used=[]
            )

    async def _generate_openai_response(self, system_prompt: str, user_message: str) -> str:
        """Generate response using OpenAI API"""
        try:
            from openai import AsyncOpenAI
            
            # Initialize client with API key
            client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            response = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            raise

    async def _generate_fallback_response(self, user_message: str, context_snippets: List[str], honesty_mode: bool) -> str:
        """Generate a rule-based fallback response"""
        # Simple rule-based responses based on keywords and context
        user_lower = user_message.lower()
        
        # Check for concerning content
        concerning_keywords = ["hurt", "harm", "suicide", "die", "kill", "end it"]
        if any(keyword in user_lower for keyword in concerning_keywords):
            return "I'm really concerned about what you're sharing. Please reach out to a mental health professional, a trusted friend, or a crisis helpline. You're not alone, and there are people who want to help. In the US, you can contact the National Suicide Prevention Lifeline at 988."
        
        # Mood-based responses
        positive_keywords = ["happy", "good", "great", "excited", "joy"]
        negative_keywords = ["sad", "upset", "angry", "frustrated", "down", "depressed"]
        anxiety_keywords = ["anxious", "worried", "stress", "nervous", "panic"]
        
        if any(keyword in user_lower for keyword in positive_keywords):
            if context_snippets:
                return "It's wonderful to hear you're feeling positive! I noticed in your recent entries that you've been working through some things. What's contributing to this good feeling today?"
            else:
                return "That's great to hear! What's been bringing you joy lately? It's important to celebrate these positive moments."
        
        elif any(keyword in user_lower for keyword in anxiety_keywords):
            response = "I can hear that you're feeling anxious right now, and that's completely valid. "
            if honesty_mode:
                response += "Try focusing on what you can control today. What's one small action you can take right now?"
            else:
                response += "Take a deep breath with me. What usually helps you feel more grounded?"
            return response
        
        elif any(keyword in user_lower for keyword in negative_keywords):
            response = "I'm sorry you're going through a difficult time. Your feelings are completely valid. "
            if context_snippets:
                response += "Looking at your recent entries, it seems like you've been processing a lot. What feels most heavy right now?"
            else:
                response += "Would you like to share what's been weighing on your mind?"
            return response
        
        # Default supportive response
        if context_snippets:
            return "Thank you for sharing with me. I can see from your recent entries that you've been reflecting on important things. What's on your mind today?"
        else:
            return "I'm here to listen and support you. What would you like to talk about today? Sometimes it helps to just put your thoughts into words."

    def safety_check(self, text: str) -> bool:
        """Check if text contains concerning content"""
        concerning_patterns = [
            "kill myself", "end my life", "want to die", "suicide", 
            "hurt myself", "self harm", "cut myself"
        ]
        
        text_lower = text.lower()
        return any(pattern in text_lower for pattern in concerning_patterns)