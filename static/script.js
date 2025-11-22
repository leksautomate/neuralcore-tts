// Global state
let voices = {};
let selectedVoice = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded');
    initializeTheme();
    loadVoices();
    setupTextCounter();
    setupSystemMetrics();
    loadSavedAPIKey();
    loadSavedCleanupInterval();
});

// Theme System
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'cyan';
    setTheme(savedTheme);

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

// Text counter
function setupTextCounter() {
    const textInput = document.getElementById('textInput');
    const charCount = document.getElementById('charCount');

    textInput.addEventListener('input', () => {
        charCount.textContent = textInput.value.length.toLocaleString();
    });
}

// System Metrics Simulation
function setupSystemMetrics() {
    setInterval(() => {
        document.getElementById('memoryUsage').textContent = `${Math.floor(Math.random() * 30) + 10}%`;
        document.getElementById('cpuLoad').textContent = `${Math.floor(Math.random() * 50) + 20}%`;
        document.getElementById('latency').textContent = `${Math.floor(Math.random() * 10) + 5}ms`;
    }, 3000);
}

// Load voices
async function loadVoices() {
    try {
        const response = await fetch('/api/voices');
        voices = await response.json();

        updateVoiceMatrix();

        const firstVoice = Object.keys(voices)[0];
        if (firstVoice) selectVoice(firstVoice);
    } catch (error) {
        showToast('Failed to load voices', 'error');
    }
}

// Update voice matrix
function updateVoiceMatrix() {
    const voiceMatrix = document.getElementById('voiceMatrix');
    voiceMatrix.innerHTML = '';

    Object.keys(voices).forEach(key => {
        const voice = voices[key];
        const voiceItem = document.createElement('div');
        voiceItem.className = `voice-item ${selectedVoice === key ? 'active' : ''}`;
        voiceItem.onclick = () => selectVoice(key);

        voiceItem.innerHTML = `
            <div class="voice-name">${voice.name}</div>
            <div class="voice-desc">${voice.description}</div>
            ${voice.custom ? `<button class="delete-voice-btn" onclick="event.stopPropagation(); deleteVoice('${key}')">×</button>` : ''}
        `;

        voiceMatrix.appendChild(voiceItem);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'add-voice-btn';
    addBtn.textContent = '+ ADD_CUSTOM_VOICE';
    addBtn.onclick = showAddVoiceModal;
    voiceMatrix.appendChild(addBtn);
}

// Select voice
function selectVoice(voiceKey) {
    selectedVoice = voiceKey;
    updateVoiceMatrix();

    const voice = voices[voiceKey];
    document.getElementById('modelId').textContent = voice.id;
    document.getElementById('modelDesc').textContent = voice.description;
}

// Purge input
function purgeInput() {
    document.getElementById('textInput').value = '';
    document.getElementById('charCount').textContent = '0';
    document.getElementById('audioSection').style.display = 'none';
    showToast('Input cleared', 'success');
}

// Add voice modal
function showAddVoiceModal() {
    document.getElementById('addVoiceModal').style.display = 'flex';
}

function closeAddVoiceModal() {
    document.getElementById('addVoiceModal').style.display = 'none';
    document.getElementById('addVoiceForm').reset();
}

async function addCustomVoice(event) {
    event.preventDefault();

    const key = document.getElementById('voiceKey').value.toLowerCase().replace(/\s+/g, '_');
    const name = document.getElementById('voiceName').value;
    const voiceId = document.getElementById('voiceId').value;
    const description = document.getElementById('voiceDescription').value;

    try {
        const response = await fetch('/api/voices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, name, voice_id: voiceId, description })
        });

        const data = await response.json();

        if (response.ok) {
            voices = data.voices;
            updateVoiceMatrix();
            closeAddVoiceModal();
            showToast('Voice added successfully', 'success');
            selectVoice(key);
        } else {
            showToast(data.error || 'Failed to add voice', 'error');
        }
    } catch (error) {
        showToast('Failed to add voice', 'error');
    }
}

async function deleteVoice(voiceKey) {
    if (!confirm(`Delete voice "${voices[voiceKey].name}"?`)) return;

    try {
        const response = await fetch(`/api/voices/${voiceKey}`, { method: 'DELETE' });
        const data = await response.json();

        if (response.ok) {
            voices = data.voices;
            updateVoiceMatrix();

            if (selectedVoice === voiceKey) {
                const firstVoice = Object.keys(voices)[0];
                if (firstVoice) selectVoice(firstVoice);
            }

            showToast('Voice deleted', 'success');
        } else {
            showToast(data.error || 'Failed to delete voice', 'error');
        }
    } catch (error) {
        showToast('Failed to delete voice', 'error');
    }
}

// Settings
function openSettings() {
    console.log('openSettings called');
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        console.error('Settings modal not found');
    }
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

function loadSavedAPIKey() {
    const savedKey = localStorage.getItem('speechify_api_key');
    if (savedKey) document.getElementById('apiToken').value = savedKey;
}

async function loadSavedCleanupInterval() {
    try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        const cleanupSelect = document.getElementById('cleanupInterval');
        if (cleanupSelect && data.cleanup_interval) {
            cleanupSelect.value = data.cleanup_interval;
        }
    } catch (error) {
        console.error('Error loading cleanup interval:', error);
    }
}

async function saveSettings(event) {
    event.preventDefault();

    const apiToken = document.getElementById('apiToken').value;
    const cleanupInterval = document.getElementById('cleanupInterval').value;

    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_token: apiToken,
                cleanup_interval: parseInt(cleanupInterval)
            })
        });

        if (response.ok) {
            if (apiToken) localStorage.setItem('speechify_api_key', apiToken);
            closeSettings();
            showToast('Settings saved successfully', 'success');
        } else {
            showToast('Failed to save settings', 'error');
        }
    } catch (error) {
        showToast('Failed to save settings', 'error');
    }
}

// Generate speech
async function generateSpeech() {
    const text = document.getElementById('textInput').value.trim();

    if (!text) {
        showToast('Enter text to synthesize', 'error');
        return;
    }

    if (!selectedVoice) {
        showToast('Select a voice first', 'error');
        return;
    }

    const progressSection = document.getElementById('progressSection');
    const audioSection = document.getElementById('audioSection');

    progressSection.style.display = 'block';
    audioSection.style.display = 'none';

    const progressFill = document.getElementById('progressFill');
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5;
        if (progress > 90) progress = 90;
        progressFill.style.width = progress + '%';
    }, 200);

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice: selectedVoice })
        });

        const data = await response.json();

        clearInterval(progressInterval);

        if (response.ok) {
            progressFill.style.width = '100%';

            setTimeout(() => {
                progressSection.style.display = 'none';
                audioSection.style.display = 'block';

                const audioPlayer = document.getElementById('audioPlayer');
                audioPlayer.src = `/api/play/${data.filename}`;

                const downloadBtn = document.getElementById('downloadBtn');
                downloadBtn.onclick = () => window.location.href = data.download_url;

                showToast('Synthesis complete', 'success');
            }, 500);
        } else {
            showToast(data.error || 'Synthesis failed', 'error');
            progressSection.style.display = 'none';
        }
    } catch (error) {
        clearInterval(progressInterval);
        showToast('Synthesis failed', 'error');
        progressSection.style.display = 'none';
    }
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Close modal on outside click
window.onclick = function (event) {
    const addVoiceModal = document.getElementById('addVoiceModal');
    const settingsModal = document.getElementById('settingsModal');

    if (event.target === addVoiceModal) closeAddVoiceModal();
    if (event.target === settingsModal) closeSettings();
}
