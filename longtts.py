import requests
import os
from pydub import AudioSegment
import base64
import tempfile
import re
from typing import List
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LongTextToSpeech:
    def __init__(self, api_token: str = None):
        self.api_token = api_token or os.getenv('SPEECHIFY_API_TOKEN')
        if not self.api_token:
            raise ValueError("API token is required. Set SPEECHIFY_API_TOKEN in .env file or pass it directly.")
        
        self.base_url = "https://api.sws.speechify.com/v1/audio/speech"
        self.chunk_size = 1900  # Maximum characters per chunk
        
        # Available voice models
        self.models = {
            'stark': 'fc4da0fd-52fb-4496-bd7f-b4a4e38dd57a',  # Stark voice
            'liam': '4a404804-3c9b-47d5-bd46-05d97122c841'    # Liam voice
        }

    def _prepare_output_path(self, output_path: str) -> Path:
        """Ensure the output path is safe and writable, return normalized Path.

        - Expands user/home tokens.
        - Creates parent directories if missing.
        - Validates writability by creating a small temp file in the target directory.
        """
        p = Path(output_path).expanduser()

        if p.exists() and p.is_dir():
            raise ValueError(f"Output path '{p}' is a directory; please select a .mp3 file path.")

        parent = p.parent
        try:
            parent.mkdir(parents=True, exist_ok=True)
        except PermissionError as e:
            raise PermissionError(f"Cannot create directory '{parent}': {e}") from e

        # Validate directory is writable by attempting a temp file
        try:
            tf = tempfile.NamedTemporaryFile(prefix=".probe_", suffix=".tmp", dir=str(parent), delete=False)
            tf.close()
            os.unlink(tf.name)
        except PermissionError as e:
            raise PermissionError(f"No write permission in '{parent}'. Choose a different folder.") from e
        except OSError as e:
            # Catch other OS errors (e.g., read-only media)
            raise OSError(f"Cannot write to '{parent}': {e}") from e

        return p
    
    def split_text_intelligently(self, text: str) -> List[str]:
        """Split text into chunks, preferring sentence boundaries."""
        chunks = []
        
        # First, try to split by sentences
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        current_chunk = ""
        
        for sentence in sentences:
            # If adding this sentence would exceed chunk size
            if len(current_chunk) + len(sentence) + 1 > self.chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = ""
                
                # If single sentence is too long, split it further
                if len(sentence) > self.chunk_size:
                    # Split by commas or other punctuation
                    sub_parts = re.split(r'(?<=[,;:])\s+', sentence)
                    for part in sub_parts:
                        if len(current_chunk) + len(part) + 1 > self.chunk_size:
                            if current_chunk:
                                chunks.append(current_chunk.strip())
                                current_chunk = ""
                        
                        # If even a part is too long, force split
                        if len(part) > self.chunk_size:
                            while len(part) > self.chunk_size:
                                chunks.append(part[:self.chunk_size])
                                part = part[self.chunk_size:]
                            if part:
                                current_chunk = part
                        else:
                            if current_chunk:
                                current_chunk += " " + part
                            else:
                                current_chunk = part
                else:
                    current_chunk = sentence
            else:
                if current_chunk:
                    current_chunk += " " + sentence
                else:
                    current_chunk = sentence
        
        # Add the last chunk if it exists
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def text_to_speech_chunk(self, text: str, model: str = 'stark') -> bytes:
        """Convert a single text chunk to speech using Speechify API."""
        if model not in self.models:
            raise ValueError(f"Model '{model}' not available. Choose from: {list(self.models.keys())}")
        
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "input": text,
            "voice_id": self.models[model],
            "audio_format": "mp3",
            "model": "simba-english"
        }
        
        try:
            response = requests.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            
            # Decode base64 audio data
            response_data = response.json()
            audio_base64 = response_data.get('audio_data')
            if not audio_base64:
                raise Exception("No audio data in response")
            
            return base64.b64decode(audio_base64)
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed: {e}")
    
    def combine_audio_chunks(self, audio_chunks: List[bytes], output_path: str):
        """Combine multiple audio chunks into a single MP3 file safely."""
        combined_audio = AudioSegment.empty()
        
        for i, chunk_data in enumerate(audio_chunks):
            # Save chunk to temporary file
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
                temp_file.write(chunk_data)
                temp_file_path = temp_file.name
            
            try:
                # Load the audio chunk
                audio_chunk = AudioSegment.from_mp3(temp_file_path)
                
                # Add a small pause between chunks (100ms)
                if i > 0:
                    pause = AudioSegment.silent(duration=100)
                    combined_audio += pause
                
                combined_audio += audio_chunk
                
            finally:
                # Clean up temporary file
                os.unlink(temp_file_path)
        
        # Prepare safe output path and export atomically to avoid partial files
        target_path = self._prepare_output_path(output_path)
        parent = target_path.parent
        temp_out = None
        try:
            # Use a temp file in the same directory for atomic replace
            tf = tempfile.NamedTemporaryFile(prefix=".tts_", suffix=".mp3", dir=str(parent), delete=False)
            temp_out = tf.name
            tf.close()
            combined_audio.export(temp_out, format="mp3")
            os.replace(temp_out, target_path)
        except PermissionError as e:
            raise PermissionError(f"Permission denied writing '{target_path}'. Close any apps using it or choose another location.") from e
        except FileNotFoundError as e:
            # Often indicates missing encoder (ffmpeg) when exporting
            raise FileNotFoundError("Export failed. Ensure ffmpeg is installed and available on PATH.") from e
        except Exception as e:
            raise Exception(f"Failed to save MP3 to '{target_path}': {e}") from e
        finally:
            if temp_out and os.path.exists(temp_out):
                try:
                    os.unlink(temp_out)
                except OSError:
                    pass
    
    def process_long_text(self, text: str, output_path: str, model: str = 'stark', verbose: bool = True):
        """Process long text by splitting into chunks and combining audio."""
        if verbose:
            print(f"Processing text of {len(text)} characters...")
        
        # Split text into chunks
        chunks = self.split_text_intelligently(text)
        
        if verbose:
            print(f"Split into {len(chunks)} chunks")
            for i, chunk in enumerate(chunks, 1):
                print(f"Chunk {i}: {len(chunk)} characters")
        
        # Process each chunk
        audio_chunks = []
        
        for i, chunk in enumerate(chunks, 1):
            if verbose:
                print(f"Processing chunk {i}/{len(chunks)}...")
            
            try:
                audio_data = self.text_to_speech_chunk(chunk, model)
                audio_chunks.append(audio_data)
            except Exception as e:
                print(f"Error processing chunk {i}: {e}")
                raise
        
        # Combine all audio chunks
        if verbose:
            print("Combining audio chunks...")
        
        self.combine_audio_chunks(audio_chunks, output_path)
        
        if verbose:
            print(f"Audio saved to: {output_path}")
    
    def list_models(self):
        """List available voice models."""
        print("Available voice models:")
        descriptions = {
            'stark': 'Stark voice model',
            'liam': 'Liam voice model'
        }
        
        for model, description in descriptions.items():
            print(f"  {model}: {description}")

def main():
    parser = argparse.ArgumentParser(description='Long Text to Speech using Speechify API')
    parser.add_argument('--text', '-t', type=str, help='Text to convert to speech')
    parser.add_argument('--file', '-f', type=str, help='Text file to convert to speech')
    parser.add_argument('--output', '-o', type=str, default='output.mp3', help='Output MP3 file path')
    parser.add_argument('--model', '-m', type=str, default='stark', 
                       choices=['stark', 'liam'], help='Voice model to use')
    parser.add_argument('--token', type=str, help='Speechify API token (or set SPEECHIFY_API_TOKEN env var)')
    parser.add_argument('--list-models', action='store_true', help='List available voice models')
    parser.add_argument('--quiet', '-q', action='store_true', help='Suppress verbose output')
    
    args = parser.parse_args()
    
    try:
        tts = LongTextToSpeech(api_token=args.token)
        
        if args.list_models:
            tts.list_models()
            return
        
        # Get text input
        if args.file:
            with open(args.file, 'r', encoding='utf-8') as f:
                text = f.read()
        elif args.text:
            text = args.text
        else:
            print("Enter your text (press Ctrl+D or Ctrl+Z when finished):")
            text = input()
        
        if not text.strip():
            print("No text provided.")
            return
        
        # Process the text
        tts.process_long_text(text, args.output, args.model, verbose=not args.quiet)
        
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
