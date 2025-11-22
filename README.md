# Long Text-to-Speech Platform

A Python-based text-to-speech platform that can handle long texts (up to 100,000+ characters) by intelligently splitting them into chunks and combining the audio output using the Speechify API.

## Features

- **Long Text Support**: Process texts up to 100,000+ characters by splitting into 1900-character chunks
- **Intelligent Text Splitting**: Splits text at sentence boundaries when possible, falling back to punctuation and word boundaries
- **Multiple Voice Models**: Support for Speechify's voice models (Stark, Liam)
- **Audio Combining**: Seamlessly combines multiple audio chunks into a single MP3 file
- **Modern GUI Interface**: Beautiful, user-friendly graphical interface with real-time feedback
- **Command Line Interface**: Easy-to-use CLI with multiple input options

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Set up your Speechify API token in the `.env` file:
```
SPEECHIFY_API_TOKEN=your_api_token_here
```

## Available Voice Models

- **stark**: Stark voice model
- **liam**: Liam voice model

## Usage

### Web Interface (Recommended)

Launch the Flask web application:

```bash
python app.py
```

Then open your browser and navigate to: **http://localhost:8080**

#### Web Interface Features:

- **📝 Text Input**: Large text area with real-time character counter
- **🎭 Voice Selection**: Dropdown menu with all available voices
- **➕ Custom Voice Management**: Add your own Speechify voice IDs
- **🎵 One-Click Generation**: Generate speech with animated progress bar
- **▶️ Audio Playback**: Play generated audio directly in browser
- **📥 Download**: Download generated MP3 files
- **🗑️ Voice Management**: Delete custom voices (default voices protected)

#### Adding Custom Voices:
1. Click "Add Custom Voice" button
2. Enter a unique voice key (e.g., `my_voice`)
3. Enter the voice name and Speechify voice ID
4. Add an optional description
5. Click "Add Voice" to register it

### Command Line Interface

#### Process text:
```bash
python longtts.py --text "Your text here" --output output.mp3 --model stark
```

#### Process a text file:
```bash
python longtts.py --file input.txt --output output.mp3 --model liam
```

#### List available voice models:
```bash
python longtts.py --list-models
```

#### Quiet mode (suppress verbose output):
```bash
python longtts.py --file input.txt --output output.mp3 --quiet
```

### Python API

```python
from longtts import LongTextToSpeech

# Initialize with API token
tts = LongTextToSpeech(api_token="your_token_here")

# Or use environment variable
tts = LongTextToSpeech()  # Reads from SPEECHIFY_API_TOKEN

# Process long text
long_text = "Your very long text here..." * 1000
tts.process_long_text(
    text=long_text,
    output_path="output.mp3",
    model="stark",
    verbose=True
)

# List available models
tts.list_models()
```

## How It Works

1. **Text Splitting**: The platform intelligently splits long text into chunks of up to 1900 characters, preferring to break at sentence boundaries
2. **API Processing**: Each chunk is sent to the Speechify API for text-to-speech conversion
3. **Audio Combining**: All audio chunks are combined into a single MP3 file with small pauses between chunks
4. **Output**: The final combined audio file is saved to the specified location

## Command Line Arguments

- `--text, -t`: Text to convert to speech
- `--file, -f`: Text file to convert to speech
- `--output, -o`: Output MP3 file path (default: output.mp3)
- `--model, -m`: Voice model to use (stark, liam)
- `--token`: Speechify API token (or set SPEECHIFY_API_TOKEN env var)
- `--list-models`: List available voice models
- `--quiet, -q`: Suppress verbose output

## Requirements

- Python 3.7+
- Speechify API token
- Internet connection for API calls

## Error Handling

The platform includes robust error handling for:
- API request failures
- Invalid text input
- File I/O errors
- Audio processing errors

## License

This project is open source and available under the MIT License.