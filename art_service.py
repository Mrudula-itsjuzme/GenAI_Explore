import os
import uuid
import hashlib
from typing import Optional
from PIL import Image, ImageDraw, ImageFont
import requests
from datetime import datetime

# Try to import diffusers for local art generation
try:
    from diffusers import StableDiffusionPipeline
    import torch
    DIFFUSERS_AVAILABLE = True
except ImportError:
    DIFFUSERS_AVAILABLE = False

class ArtService:
    def __init__(self):
        # Initialize Stable Diffusion pipeline if available
        self.pipeline = None
        if DIFFUSERS_AVAILABLE and torch.cuda.is_available():
            try:
                self.pipeline = StableDiffusionPipeline.from_pretrained(
                    "runwayml/stable-diffusion-v1-5",
                    torch_dtype=torch.float16
                )
                self.pipeline = self.pipeline.to("cuda")
                print("Stable Diffusion pipeline initialized successfully")
            except Exception as e:
                print(f"Could not initialize Stable Diffusion: {e}")
        
        # Style prompts for different art styles
        self.style_prompts = {
            "abstract": "abstract art, colorful, flowing shapes, emotional expression, non-representational",
            "realistic": "photorealistic, detailed, natural lighting, high quality",
            "dreamy": "dreamy, ethereal, soft lighting, fantasy, magical atmosphere",
            "minimalist": "minimalist art, clean lines, simple composition, geometric",
            "impressionist": "impressionist painting, soft brushstrokes, natural light, artistic",
            "surreal": "surreal art, dreamlike, imaginative, bizarre, otherworldly",
            "watercolor": "watercolor painting, soft colors, flowing paint, artistic medium",
            "digital": "digital art, modern, clean, contemporary style"
        }
        
        # Ensure art directory exists
        self.art_dir = "./static/art"
        os.makedirs(self.art_dir, exist_ok=True)

    async def generate_art(self, text: str, style: str = "abstract", entry_id: int = None) -> str:
        """Generate art from text using various methods"""
        try:
            # Create safe filename
            filename = self._generate_filename(text, style, entry_id)
            filepath = os.path.join(self.art_dir, filename)
            
            # Try different art generation methods in order of preference
            if self.pipeline:
                # Use local Stable Diffusion
                art_path = await self._generate_with_stable_diffusion(text, style, filepath)
                if art_path:
                    return f"/static/art/{filename}"
            
            # Fallback to placeholder art
            art_path = await self._generate_placeholder_art(text, style, filepath)
            return f"/static/art/{filename}"
            
        except Exception as e:
            print(f"Error generating art: {e}")
            # Create a simple error placeholder
            return await self._create_error_placeholder()

    async def _generate_with_stable_diffusion(self, text: str, style: str, filepath: str) -> Optional[str]:
        """Generate art using Stable Diffusion"""
        try:
            # Build prompt
            prompt = self._build_art_prompt(text, style)
            
            # Generate image
            image = self.pipeline(
                prompt,
                num_inference_steps=20,
                guidance_scale=7.5,
                width=512,
                height=512
            ).images[0]
            
            # Save image
            image.save(filepath)
            print(f"Generated art with Stable Diffusion: {filepath}")
            return filepath
            
        except Exception as e:
            print(f"Stable Diffusion generation error: {e}")
            return None

    async def _generate_placeholder_art(self, text: str, style: str, filepath: str) -> str:
        """Generate placeholder art with text overlay"""
        try:
            # Create a colorful gradient background based on text sentiment
            image = Image.new('RGB', (512, 512), color=self._get_mood_color(text))
            draw = ImageDraw.Draw(image)
            
            # Add gradient effect
            for y in range(512):
                gradient_color = self._interpolate_color(
                    self._get_mood_color(text),
                    self._get_secondary_color(style),
                    y / 512
                )
                draw.line([(0, y), (512, y)], fill=gradient_color)
            
            # Add text overlay
            text_excerpt = text[:50] + "..." if len(text) > 50 else text
            
            # Try to use a nice font, fallback to default
            try:
                font = ImageFont.truetype("arial.ttf", 24)
            except:
                font = ImageFont.load_default()
            
            # Calculate text position for centering
            bbox = draw.textbbox((0, 0), text_excerpt, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x = (512 - text_width) // 2
            y = (512 - text_height) // 2
            
            # Add text with shadow for better visibility
            draw.text((x+2, y+2), text_excerpt, fill=(0, 0, 0, 128), font=font)
            draw.text((x, y), text_excerpt, fill=(255, 255, 255), font=font)
            
            # Add style indicator
            style_text = f"Style: {style.title()}"
            draw.text((20, 20), style_text, fill=(255, 255, 255, 180), font=font)
            
            # Save image
            image.save(filepath)
            print(f"Generated placeholder art: {filepath}")
            return filepath
            
        except Exception as e:
            print(f"Placeholder art generation error: {e}")
            raise

    def _build_art_prompt(self, text: str, style: str) -> str:
        """Build an artistic prompt for image generation"""
        # Extract key emotional words and themes from text
        keywords = self._extract_keywords(text)
        
        # Get style prompt
        style_prompt = self.style_prompts.get(style, self.style_prompts["abstract"])
        
        # Build final prompt - allow free expression
        prompt = f"Beautiful {style_prompt}, inspired by themes of {', '.join(keywords[:3])}, artistic, high quality, expressive"
        
        return prompt

    def _extract_keywords(self, text: str) -> list:
        """Extract emotional and thematic keywords from text"""
        # Simple keyword extraction based on common emotional themes
        emotional_keywords = [
            "peace", "calm", "serenity", "joy", "happiness", "love", "hope",
            "growth", "change", "reflection", "nature", "beauty", "connection",
            "strength", "healing", "discovery", "journey", "light", "color",
            "harmony", "balance", "freedom", "expression", "creativity"
        ]
        
        text_lower = text.lower()
        found_keywords = [kw for kw in emotional_keywords if kw in text_lower]
        
        # If no emotional keywords found, add some default artistic themes
        if not found_keywords:
            found_keywords = ["abstract", "emotion", "expression"]
        
        return found_keywords

    def _get_mood_color(self, text: str) -> tuple:
        """Get a color based on the mood of the text"""
        text_lower = text.lower()
        
        # Color mappings for different moods/themes
        if any(word in text_lower for word in ["happy", "joy", "excited", "energetic"]):
            return (255, 215, 0)  # Gold
        elif any(word in text_lower for word in ["sad", "blue", "down"]):
            return (70, 130, 180)  # Steel Blue
        elif any(word in text_lower for word in ["angry", "frustrated", "mad"]):
            return (220, 20, 60)  # Crimson
        elif any(word in text_lower for word in ["calm", "peaceful", "serene"]):
            return (152, 251, 152)  # Pale Green
        elif any(word in text_lower for word in ["anxious", "nervous", "worried"]):
            return (186, 85, 211)  # Medium Orchid
        else:
            return (100, 149, 237)  # Cornflower Blue

    def _get_secondary_color(self, style: str) -> tuple:
        """Get secondary color based on art style"""
        style_colors = {
            "abstract": (255, 165, 0),      # Orange
            "realistic": (139, 69, 19),     # Saddle Brown
            "dreamy": (221, 160, 221),      # Plum
            "minimalist": (220, 220, 220),  # Light Gray
            "impressionist": (255, 182, 193), # Light Pink
            "surreal": (148, 0, 211),       # Dark Violet
            "watercolor": (176, 224, 230),  # Powder Blue
            "digital": (50, 205, 50)        # Lime Green
        }
        return style_colors.get(style, (128, 128, 128))

    def _interpolate_color(self, color1: tuple, color2: tuple, factor: float) -> tuple:
        """Interpolate between two colors"""
        r1, g1, b1 = color1
        r2, g2, b2 = color2
        
        r = int(r1 + (r2 - r1) * factor)
        g = int(g1 + (g2 - g1) * factor)
        b = int(b1 + (b2 - b1) * factor)
        
        return (r, g, b)

    def _generate_filename(self, text: str, style: str, entry_id: int) -> str:
        """Generate a unique filename for the art piece"""
        # Create a hash of the text and style for uniqueness
        content = f"{text}_{style}_{entry_id}_{datetime.now().isoformat()}"
        hash_object = hashlib.md5(content.encode())
        hex_dig = hash_object.hexdigest()[:12]
        
        return f"art_{entry_id}_{style}_{hex_dig}.png"

    async def _create_error_placeholder(self) -> str:
        """Create a simple error placeholder image"""
        try:
            filename = f"error_placeholder_{uuid.uuid4().hex[:8]}.png"
            filepath = os.path.join(self.art_dir, filename)
            
            # Create simple error image
            image = Image.new('RGB', (512, 512), color=(240, 240, 240))
            draw = ImageDraw.Draw(image)
            
            # Add error message
            error_text = "Art generation\ntemporarily\nunavailable"
            try:
                font = ImageFont.truetype("arial.ttf", 36)
            except:
                font = ImageFont.load_default()
            
            # Center the text
            bbox = draw.multiline_textbbox((0, 0), error_text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x = (512 - text_width) // 2
            y = (512 - text_height) // 2
            
            draw.multiline_text((x, y), error_text, fill=(128, 128, 128), font=font, align="center")
            
            image.save(filepath)
            return f"/static/art/{filename}"
            
        except Exception as e:
            print(f"Error creating placeholder: {e}")
            return "/static/placeholder.png"  # Fallback to a default image

    def safety_check(self, text: str) -> bool:
        """Check if text is appropriate for art generation"""
        # Allow free expression - only block truly harmful content
        harmful_content = [
            "child", "minor", "illegal", "terrorist", "bomb", "suicide"
        ]
        
        text_lower = text.lower()
        return not any(harmful in text_lower for harmful in harmful_content)
