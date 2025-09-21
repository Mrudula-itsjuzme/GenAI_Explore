import os
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from typing import Dict, List, Optional, Any
from models import PlaylistResponse
import random

class PlaylistService:
    def __init__(self):
        # Initialize Spotify client (optional)
        self.spotify = None
        if os.getenv("SPOTIFY_CLIENT_ID") and os.getenv("SPOTIFY_CLIENT_SECRET"):
            try:
                client_credentials_manager = SpotifyClientCredentials(
                    client_id=os.getenv("SPOTIFY_CLIENT_ID"),
                    client_secret=os.getenv("SPOTIFY_CLIENT_SECRET")
                )
                self.spotify = spotipy.Spotify(client_credentials_manager=client_credentials_manager)
            except Exception as e:
                print(f"Spotify initialization error: {e}")
        
        # Enhanced mood-to-genre mappings with more nuanced categorization
        self.mood_genres = {
            "happy": ["pop", "indie", "alternative", "funk", "dance", "reggae", "soul"],
            "sad": ["indie", "alternative", "acoustic", "folk", "blues", "singer-songwriter", "ambient"],
            "anxious": ["ambient", "chill", "instrumental", "acoustic", "new-age", "classical", "lo-fi"],
            "excited": ["pop", "electronic", "dance", "rock", "hip-hop", "house", "disco"],
            "calm": ["ambient", "chill", "jazz", "classical", "new-age", "acoustic", "world"],
            "frustrated": ["rock", "alternative", "punk", "metal", "grunge", "industrial", "hardcore"],
            "grateful": ["folk", "acoustic", "indie", "soul", "gospel", "country", "world"],
            "lonely": ["indie", "alternative", "acoustic", "folk", "ambient", "singer-songwriter", "sad"],
            "confident": ["hip-hop", "pop", "rock", "electronic", "funk", "r&b", "trap"],
            "overwhelmed": ["ambient", "instrumental", "chill", "classical", "jazz", "new-age", "meditation"],
            "peaceful": ["ambient", "classical", "jazz", "chill", "new-age", "nature", "meditation"],
            "angry": ["rock", "metal", "punk", "alternative", "industrial", "hardcore", "nu-metal"],
            "hopeful": ["indie", "pop", "folk", "acoustic", "alternative", "singer-songwriter", "inspirational"],
            "tired": ["chill", "ambient", "lo-fi", "jazz", "acoustic", "sleep", "soft"],
            "energetic": ["pop", "dance", "electronic", "rock", "hip-hop", "workout", "upbeat"],
            "content": ["indie", "folk", "acoustic", "chill", "jazz", "soft-rock", "easy-listening"]
        }
        
        # Mood combinations for more nuanced playlists
        self.mood_combinations = {
            "melancholic_but_hopeful": ["sad", "hopeful"],
            "anxious_excitement": ["anxious", "excited"],
            "peaceful_gratitude": ["peaceful", "grateful"],
            "tired_but_content": ["tired", "content"]
        }
        
        # Fallback curated playlists for each mood
        self.fallback_tracks = {
            "happy": [
                {"name": "Good 4 U", "artist": "Olivia Rodrigo", "spotify_url": "spotify:track:4ZtFanR9U6ndgddUvNcjcG"},
                {"name": "Levitating", "artist": "Dua Lipa", "spotify_url": "spotify:track:463CkQjx2Zk1yXoBuierM9"},
                {"name": "Blinding Lights", "artist": "The Weeknd", "spotify_url": "spotify:track:0VjIjW4GlUKvbFBwSJJNh9"},
                {"name": "Watermelon Sugar", "artist": "Harry Styles", "spotify_url": "spotify:track:6UelLqGlWMcVH1E5c4H7lY"},
                {"name": "Don't Start Now", "artist": "Dua Lipa", "spotify_url": "spotify:track:6WrI0LAC5M1Rw2MnX2ZvEg"}
            ],
            "sad": [
                {"name": "Someone Like You", "artist": "Adele", "spotify_url": "spotify:track:1zwMYTA5nlNjZxYrvBB2pV"},
                {"name": "Mad World", "artist": "Donnie Darko", "spotify_url": "spotify:track:3JOVTQ5h8HGFnDdp4VT3MP"},
                {"name": "Hurt", "artist": "Johnny Cash", "spotify_url": "spotify:track:4a8tODNjeP6JxJhHbpUTnL"},
                {"name": "Black", "artist": "Pearl Jam", "spotify_url": "spotify:track:6q8cB3nkhGgOJFIlPOLKrJ"},
                {"name": "Creep", "artist": "Radiohead", "spotify_url": "spotify:track:70LcF31zb1H0PyJoS1Sx1r"}
            ],
            "anxious": [
                {"name": "Weightless", "artist": "Marconi Union", "spotify_url": "spotify:track:7MXmNd0bcrGRePdKFgRQ7m"},
                {"name": "Clair de Lune", "artist": "Claude Debussy", "spotify_url": "spotify:track:2EqlS6tkEnglzr7tkKAAYD"},
                {"name": "Aqueous Transmission", "artist": "Incubus", "spotify_url": "spotify:track:1Y7aCzfXpMLJEwCmGKM0fH"},
                {"name": "River", "artist": "Leon Bridges", "spotify_url": "spotify:track:4q0MoLaIUFQr6oJAfMjdNe"},
                {"name": "Holocene", "artist": "Bon Iver", "spotify_url": "spotify:track:2J1QInOyOOKeeXmKGl6vL1"}
            ],
            "calm": [
                {"name": "Gymnopédie No. 1", "artist": "Erik Satie", "spotify_url": "spotify:track:4L3gGGbgkgmhPsbyNF2Df8"},
                {"name": "On Earth as It Is in Heaven", "artist": "Angels & Airwaves", "spotify_url": "spotify:track:5dA1ZhfWCMSXVwlYbNEJXp"},
                {"name": "Svefn-g-englar", "artist": "Sigur Rós", "spotify_url": "spotify:track:4lY3bJHQHPDRKy5Kol2QfJ"},
                {"name": "River", "artist": "Eminem ft. Ed Sheeran", "spotify_url": "spotify:track:5YhG5hSlc3fRex7jJjj3zA"},
                {"name": "Miserere", "artist": "Gregorio Allegri", "spotify_url": "spotify:track:0VeWe5tENbOgL9vexz2rK0"}
            ]
        }
        
        # Add default tracks for moods not explicitly defined
        default_tracks = [
            {"name": "Breathe Me", "artist": "Sia", "spotify_url": "spotify:track:2s7LpjzeJNGLYxJhMPSV9U"},
            {"name": "Fix You", "artist": "Coldplay", "spotify_url": "spotify:track:7LVHVU3tWfcxj5aiPFEW4Q"},
            {"name": "The Sound of Silence", "artist": "Simon & Garfunkel", "spotify_url": "spotify:track:7o2CTH4ctstm8TNelqjb51"}
        ]
        
        for mood in self.mood_genres:
            if mood not in self.fallback_tracks:
                self.fallback_tracks[mood] = random.sample(default_tracks, min(3, len(default_tracks)))

    async def generate_playlist(self, mood_tag: str, preferences: Optional[Dict[str, Any]] = None) -> PlaylistResponse:
        """Generate a mood-based playlist"""
        try:
            # Get genres for the mood
            genres = self.mood_genres.get(mood_tag, ["indie", "alternative"])
            
            # Try to get tracks from Spotify API
            if self.spotify:
                tracks = await self._get_spotify_tracks(mood_tag, genres, preferences)
                if tracks:
                    justification = await self._generate_justification(mood_tag, len(tracks))
                    return PlaylistResponse(
                        playlist_name=f"Feeling {mood_tag.title()}",
                        tracks=tracks,
                        justification=justification
                    )
            
            # Fallback to curated tracks
            fallback_tracks = self.fallback_tracks.get(mood_tag, self.fallback_tracks["calm"])
            justification = f"A carefully curated playlist for when you're feeling {mood_tag}. These songs were chosen to complement and support your current emotional state."
            
            return PlaylistResponse(
                playlist_name=f"Mudi's {mood_tag.title()} Mix",
                tracks=fallback_tracks[:5],  # Limit to 5 tracks
                justification=justification
            )
            
        except Exception as e:
            print(f"Error generating playlist: {e}")
            raise

    async def _get_spotify_tracks(self, mood_tag: str, genres: List[str], preferences: Optional[Dict[str, Any]] = None) -> List[Dict[str, str]]:
        """Get tracks from Spotify API"""
        try:
            # Set up search parameters
            limit = preferences.get("limit", 10) if preferences else 10
            market = preferences.get("market", "US") if preferences else "US"
            
            all_tracks = []
            
            # Search for tracks in each genre
            for genre in genres[:2]:  # Limit to first 2 genres to avoid too many API calls
                try:
                    # Get recommendations based on genre and audio features
                    audio_features = self._get_mood_audio_features(mood_tag)
                    
                    results = self.spotify.recommendations(
                        seed_genres=[genre],
                        limit=5,
                        market=market,
                        **audio_features
                    )
                    
                    for track in results['tracks']:
                        track_info = {
                            "name": track['name'],
                            "artist": track['artists'][0]['name'],
                            "spotify_url": track['external_urls']['spotify']
                        }
                        all_tracks.append(track_info)
                        
                except Exception as e:
                    print(f"Error fetching tracks for genre {genre}: {e}")
                    continue
            
            # Remove duplicates and limit results
            seen = set()
            unique_tracks = []
            for track in all_tracks:
                track_key = f"{track['name']}_{track['artist']}"
                if track_key not in seen:
                    seen.add(track_key)
                    unique_tracks.append(track)
                    if len(unique_tracks) >= limit:
                        break
            
            return unique_tracks
            
        except Exception as e:
            print(f"Spotify API error: {e}")
            return []

    def _get_mood_audio_features(self, mood_tag: str) -> Dict[str, float]:
        """Get audio features based on mood"""
        # Audio feature mappings for different moods
        mood_features = {
            "happy": {"target_valence": 0.8, "target_energy": 0.7, "target_danceability": 0.6},
            "sad": {"target_valence": 0.2, "target_energy": 0.3, "target_acousticness": 0.7},
            "anxious": {"target_valence": 0.4, "target_energy": 0.2, "target_instrumentalness": 0.5},
            "excited": {"target_valence": 0.9, "target_energy": 0.9, "target_danceability": 0.8},
            "calm": {"target_valence": 0.5, "target_energy": 0.2, "target_acousticness": 0.8},
            "frustrated": {"target_valence": 0.3, "target_energy": 0.8, "target_loudness": -5},
            "grateful": {"target_valence": 0.7, "target_energy": 0.5, "target_acousticness": 0.6},
            "lonely": {"target_valence": 0.3, "target_energy": 0.3, "target_acousticness": 0.7},
            "confident": {"target_valence": 0.8, "target_energy": 0.8, "target_danceability": 0.7},
            "overwhelmed": {"target_valence": 0.4, "target_energy": 0.2, "target_instrumentalness": 0.6},
            "peaceful": {"target_valence": 0.6, "target_energy": 0.2, "target_acousticness": 0.8},
            "angry": {"target_valence": 0.2, "target_energy": 0.9, "target_loudness": -3},
            "hopeful": {"target_valence": 0.7, "target_energy": 0.6, "target_acousticness": 0.5},
            "tired": {"target_valence": 0.4, "target_energy": 0.2, "target_tempo": 80},
            "energetic": {"target_valence": 0.8, "target_energy": 0.9, "target_tempo": 120},
            "content": {"target_valence": 0.6, "target_energy": 0.5, "target_acousticness": 0.6}
        }
        
        return mood_features.get(mood_tag, {"target_valence": 0.5, "target_energy": 0.5})

    async def _generate_justification(self, mood_tag: str, track_count: int) -> str:
        """Generate a justification for the playlist"""
        mood_explanations = {
            "happy": "uplifting and energetic tracks to amplify your positive energy",
            "sad": "gentle and contemplative songs to accompany you through this moment",
            "anxious": "calming and soothing tracks to help ease your mind",
            "excited": "high-energy songs that match your enthusiasm",
            "calm": "peaceful and serene music to maintain your tranquil state",
            "frustrated": "cathartic tracks that acknowledge your feelings while providing release",
            "grateful": "heartwarming songs that celebrate the good in life",
            "lonely": "comforting tracks to remind you that you're not alone",
            "confident": "empowering anthems to boost your self-assurance",
            "overwhelmed": "gentle instrumental pieces to help clear your mind",
            "peaceful": "serene compositions to deepen your sense of calm",
            "angry": "intense tracks that provide a healthy outlet for your emotions",
            "hopeful": "inspiring songs that nurture your optimism",
            "tired": "mellow tunes perfect for rest and reflection",
            "energetic": "dynamic tracks that fuel your motivation",
            "content": "balanced melodies that complement your satisfied mood"
        }
        
        explanation = mood_explanations.get(mood_tag, "carefully selected tracks that resonate with your current emotional state")
        
        return f"I've curated {track_count} {explanation}. Music can be a powerful companion for processing emotions and enhancing your well-being."