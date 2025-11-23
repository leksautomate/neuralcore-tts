<div align="center">

# 🧠 NEURALCORE

### Advanced Neural Text-to-Speech System

*A stunning cyberpunk-themed TTS web application with immersive 3D visuals and premium AI voices*

![Version](https://img.shields.io/badge/version-5.1.0-00f3ff)
![Status](https://img.shields.io/badge/status-online-0aff0a)
![License](https://img.shields.io/badge/license-MIT-bd00ff)

</div>

---

## 📖 Description

**NEURALCORE** is a cutting-edge text-to-speech web application that combines premium AI voice synthesis with breathtaking cyberpunk aesthetics. Built as a single-file HTML application, it offers a complete TTS solution with zero backend dependencies, featuring:

- 🎨 **Immersive 3D Interface** - Real-time Three.js particle animations
- 🎙️ **Premium AI Voices** - Powered by Speechify's neural TTS engine
- 💾 **Smart Local Storage** - IndexedDB with auto-cleanup system
- 🌐 **100% Client-Side** - No server required, runs entirely in browser
- 🔊 **Unlimited Length** - Handles up to 100,000 characters with intelligent chunking
- 📱 **Fully Responsive** - Beautiful on desktop, tablet, and mobile

Perfect for content creators, developers, accessibility tools, audiobook production, and anyone needing high-quality text-to-speech synthesis with a stunning user interface.

---

## ✨ Features

### � Cyberpunk Aesthetic
- **3D Background**: Real-time Three.js particle sphere with wireframe ring
- **CRT Effects**: Authentic scanlines and vignette overlay
- **Glitch Animations**: Dynamic hover effects
- **HUD Design**: Futuristic glass-morphism panels
- **5 Theme Colors**: Cyan, Green, Red, Purple, Gold

### 🎙️ Text-to-Speech
- **Premium Voices**: STARK (Narrative), LIAM (Casual), SIMBA (English)
- **Speechify API**: High-quality neural voice synthesis
- **Smart Chunking**: Automatically splits long text (up to 100,000 characters)
- **Audio Visualizer**: Real-time animated bars synced to playback
- **Progress Tracking**: Live synthesis status updates

### 💾 Storage & History
- **IndexedDB**: All audio saved locally in browser
- **Auto-Purge**: Removes archives older than 20 minutes
- **History Panel**: Replay, download, or delete past generations
- **Storage Monitor**: Live usage tracking in header

### ⚙️ Configuration
- **API Key Management**: Store your Speechify API token
- **Chunk Size Control**: Configure text splitting (1900 chars default)
- **Theme Switcher**: Change core energy color
- **Persistent Settings**: Saved in localStorage

## 🚀 Quick Start

1. **Open NEURALCORE**: Simply open `index.html` in any modern browser
2. **Configure API**: Click settings (⚙️) and enter your Speechify API token
3. **Select Voice Model**: Choose from STARK, LIAM, or SIMBA in the Voice Matrix
4. **Input Text Stream**: Type or paste your text (up to 100,000 characters)
5. **Initialize Synthesis**: Click "INITIALIZE_SYNTHESIS" to generate and play audio
6. **Download**: Save your generated audio as MP3

## 🔑 API Key

The system uses the Speechify API. Get your key at:
- [Speechify API Documentation](https://docs.sws.speechify.com/)

Default key is included for testing (limited usage).

## 🎮 Controls

| Button | Function |
|--------|----------|
| ⚙️ | Open settings modal |
| 🕐 | View generation history |
| 🗑️ | Clear input text |
| ⬇️ | Download current audio |
| ▶️ | Generate and play audio |

## 🛠️ Technical Stack

- **Frontend**: Pure HTML5 + Vanilla JavaScript
- **3D Graphics**: Three.js (r128)
- **Styling**: TailwindCSS
- **Fonts**: Orbitron, Share Tech Mono
- **Icons**: Font Awesome 6.4
- **Storage**: IndexedDB
- **API**: Speechify TTS

## 📁 Project Structure

```
neuralcore/
├── index.html          # Complete NEURALCORE application
├── README.md           # This file
├── DEPLOY.md           # VPS deployment guide
├── deploy_vps.sh       # Automated deployment script
└── .gitignore          # Git ignore rules
```

## 🎨 Customization

### Add New Voices
Edit the `voices` array in the `<script>` section:
```javascript
const voices = [
    { id: 'voice-id', name: 'NAME', type: 'TYPE', desc: 'Description' },
    // Add more voices...
];
```

### Change Auto-Purge Time
Modify `RETENTION_MS` (default: 20 minutes):
```javascript
const RETENTION_MS = 20 * 60 * 1000; // milliseconds
```

### Adjust Chunk Size
Default is 1900 characters (Speechify limit ~5000):
```javascript
chunkSize: parseInt(localStorage.getItem('tts_chunk_size')) || 1900,
```

## 🌐 Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Requires IndexedDB and WebGL support

## 📝 License

MIT License - Feel free to use and modify

---

## 🔮 System Status

```
┌─────────────────────────────────────┐
│  NEURALCORE // SYSTEM INFORMATION   │
├─────────────────────────────────────┤
│  VERSION:     5.1.0                 │
│  STATUS:      ONLINE                │
│  PROTOCOL:    TLS 1.3               │
│  SYSTEM_ID:   0x4A92-F              │
│  UPTIME:      99.9%                 │
└─────────────────────────────────────┘
```

---

<div align="center">

**NEURALCORE // SECURE CONNECTION ESTABLISHED**

*Built with ❤️ for the future of AI voice synthesis*

</div>