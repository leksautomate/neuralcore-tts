import os
import json
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_file, url_for
from longtts import LongTextToSpeech
from dotenv import load_dotenv, set_key
from datetime import datetime
import time
from apscheduler.schedulers.background import BackgroundScheduler

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'

# Create necessary directories
Path(app.config['UPLOAD_FOLDER']).mkdir(exist_ok=True)
Path(app.config['OUTPUT_FOLDER']).mkdir(exist_ok=True)

# Cleanup function
def cleanup_old_files():
    """Delete audio files older than configured interval"""
    try:
        cleanup_interval = int(os.getenv('CLEANUP_INTERVAL_MINUTES', '60'))
        output_folder = app.config['OUTPUT_FOLDER']
        
        if not os.path.exists(output_folder):
            return
        
        current_time = time.time()
        cutoff_time = current_time - (cleanup_interval * 60)
        deleted_count = 0
        
        for filename in os.listdir(output_folder):
            if filename.endswith('.mp3'):
                file_path = os.path.join(output_folder, filename)
                file_mtime = os.path.getmtime(file_path)
                
                if file_mtime < cutoff_time:
                    os.remove(file_path)
                    deleted_count += 1
        
        if deleted_count > 0:
            print(f"[CLEANUP] Deleted {deleted_count} old audio file(s)")
    except Exception as e:
        print(f"[CLEANUP ERROR] {e}")

# Initialize background scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(func=cleanup_old_files, trigger="interval", minutes=15)
scheduler.start()
print("[SCHEDULER] Auto-cleanup running every 15 minutes")

# Voice storage file
VOICES_FILE = 'voices.json'

def load_voices():
    """Load voices from JSON file"""
    if os.path.exists(VOICES_FILE):
        with open(VOICES_FILE, 'r') as f:
            return json.load(f)
    else:
        return {
            'stark': {
                'id': 'fc4da0fd-52fb-4496-bd7f-b4a4e38dd57a',
                'name': 'STARK',
                'description': 'BRITISH // BARITONE',
                'custom': False
            },
            'liam': {
                'id': '4a404804-3c9b-47d5-bd46-05d97122c841',
                'name': 'LIAM',
                'description': 'AMERICAN // PRO',
                'custom': False
            },
            'mara': {
                'id': 'b80d6089-6a39-45e6-933d-0c8b26c6ad49',
                'name': 'MARA',
                'description': 'AMERICAN // SOFT',
                'custom': False
            },
            'henry': {
                'id': '820a3788-2b37-4d21-847a-b65d8a68c99a',
                'name': 'HENRY',
                'description': 'AMERICAN // FEM',
                'custom': False
            }
        }

def save_voices(voices):
    """Save voices to JSON file"""
    with open(VOICES_FILE, 'w') as f:
        json.dump(voices, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/voices', methods=['GET'])
def get_voices():
    voices = load_voices()
    return jsonify(voices)

@app.route('/api/voices', methods=['POST'])
def add_voice():
    data = request.json
    voice_key = data.get('key', '').lower().replace(' ', '_')
    voice_name = data.get('name', '')
    voice_id = data.get('voice_id', '')
    voice_description = data.get('description', '')
    
    if not all([voice_key, voice_name, voice_id]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    voices = load_voices()
    if voice_key in voices:
        return jsonify({'error': 'Voice key already exists'}), 400
    
    voices[voice_key] = {
        'id': voice_id,
        'name': voice_name,
        'description': voice_description or f'{voice_name} voice model',
        'custom': True
    }
    
    save_voices(voices)
    return jsonify({'message': 'Voice added successfully', 'voices': voices})

@app.route('/api/voices/<voice_key>', methods=['DELETE'])
def delete_voice(voice_key):
    voices = load_voices()
    if voice_key not in voices:
        return jsonify({'error': 'Voice not found'}), 404
    if not voices[voice_key].get('custom', False):
        return jsonify({'error': 'Cannot delete default voices'}), 400
    
    del voices[voice_key]
    save_voices(voices)
    return jsonify({'message': 'Voice deleted successfully', 'voices': voices})

@app.route('/api/generate', methods=['POST'])
def generate_speech():
    try:
        data = request.json
        text = data.get('text', '')
        voice_key = data.get('voice', 'stark')
        
        if not text.strip():
            return jsonify({'error': 'No text provided'}), 400
        
        voices = load_voices()
        if voice_key not in voices:
            return jsonify({'error': 'Invalid voice selected'}), 400
        
        tts = LongTextToSpeech()
        tts.models = {key: voices[key]['id'] for key in voices}
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_filename = f'speech_{timestamp}.mp3'
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        
        tts.process_long_text(text=text, output_path=output_path, model=voice_key, verbose=False)
        
        return jsonify({
            'message': 'Speech generated successfully',
            'filename': output_filename,
            'download_url': url_for('download_file', filename=output_filename)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<filename>')
def download_file(filename):
    file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True, download_name=filename, mimetype='audio/mpeg')
    return jsonify({'error': 'File not found'}), 404

@app.route('/api/play/<filename>')
def play_file(filename):
    file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    if os.path.exists(file_path):
        return send_file(file_path, mimetype='audio/mpeg')
    return jsonify({'error': 'File not found'}), 404

@app.route('/api/settings', methods=['POST'])
def save_settings():
    """Save settings to environment file"""
    try:
        data = request.json
        api_token = data.get('api_token')
        cleanup_interval = data.get('cleanup_interval')
        
        env_file = '.env'
        
        if api_token:
            set_key(env_file, 'SPEECHIFY_API_TOKEN', api_token)
            os.environ['SPEECHIFY_API_TOKEN'] = api_token
        
        if cleanup_interval:
            set_key(env_file, 'CLEANUP_INTERVAL_MINUTES', str(cleanup_interval))
            os.environ['CLEANUP_INTERVAL_MINUTES'] = str(cleanup_interval)
        
        return jsonify({'message': 'Settings saved successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get current settings"""
    return jsonify({
        'cleanup_interval': int(os.getenv('CLEANUP_INTERVAL_MINUTES', '60'))
    })

@app.route('/api/cleanup-now', methods=['POST'])
def manual_cleanup():
    """Manually trigger cleanup"""
    try:
        cleanup_old_files()
        return jsonify({'message': 'Cleanup completed'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=8080)
