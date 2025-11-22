// Global state
let voices = {};
let currentAudioUrl = null;
let selectedVoice = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    loadVoices();
    setupTextCounter();
    setupSystemMetrics();
    loadSavedAPIKey();
    loadHistory();
});

// Theme System
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'cyan';
    setTheme(savedTheme);

    // Theme button click handlers
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            setTheme(theme);
        });
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Update active state on buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

// Text character counter
function setupTextCounter() {
    const textInput = document.getElementById('textInput');
    const charCount = document.getElementById('charCount');

    textInput.addEventListener('input', () => {
        const count = textInput.value.length;
        charCount.textContent = count.toLocaleString();
    });
}

// System Metrics Simulation
function setupSystemMetrics() {
    updateMetrics();
    setInterval(updateMetrics, 3000);
}

function updateMetrics() {
    const memory = Math.floor(Math.random() * 30) + 10;
    const cpu = Math.floor(Math.random() * 50) + 20;
    const latency = Math.floor(Math.random() * 10) + 5;

    document.getElementById('memoryUsage').textContent = `${memory}%`;
    document.getElementById('cpuLoad').textContent = `${cpu}%`;
    document.getElementById('latency').textContent = `${latency}ms`;
}

// Load voices from API
async function loadVoices() {
    try {
        const response = await fetch('/api/voices');
        voices = await response.json();

        updateVoiceMatrix();

        // Auto-select first voice
        const firstVoice = Object.keys(voices)[0];
        if (firstVoice) {
            selectVoice(firstVoice);
        }
    } catch (error) {
        showToast('Failed to load voices', 'error');
        console.error('Error loading voices:', error);
    }
}

// Update voice matrix display
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
        `;

        voiceMatrix.appendChild(voiceItem);
    });

    // Add voice button
    const addBtn = document.createElement('button');
    addBtn.className = 'add-voice-btn';
    addBtn.textContent = '+ ADD_CUSTOM_VOICE';
    addBtn.onclick = showAddVoiceModal;
    voiceMatrix.appendChild(addBtn);
}

// Select a voice
function selectVoice(voiceKey) {
    selectedVoice = voiceKey;
    updateVoiceMatrix();

    // Update model info
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

// Show add voice modal
function showAddVoiceModal() {
    document.getElementById('addVoiceModal').style.display = 'flex';
}

// Close add voice modal
function closeAddVoiceModal() {
    document.getElementById('addVoiceModal').style.display = 'none';
    document.getElementById('addVoiceForm').reset();
}

// Add custom voice
async function addCustomVoice(event) {
    event.preventDefault();

    const key = document.getElementById('voiceKey').value.toLowerCase().replace(/\s+/g, '_');
    const name = document.getElementById('voiceName').value;
    const voiceId = document.getElementById('voiceId').value;
    const description = document.getElementById('voiceDescription').value;

    try {
        const response = await fetch('/api/voices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                key: key,
                name: name,
                voice_id: voiceId,
                description: description
            })
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
        console.error('Error adding voice:', error);
    }
}

// Delete custom voice
async function deleteVoice(voiceKey) {
    if (!confirm(`Delete voice "${voices[voiceKey].name}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/voices/${voiceKey}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            voices = data.voices;
            updateVoiceMatrix();

            // Select another voice if deleted was selected
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
        console.error('Error deleting voice:', error);
    }
}

// Settings
function openSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

function loadSavedAPIKey() {
    const savedKey = localStorage.getItem('speechify_api_key');
    if (savedKey) {
        document.getElementById('apiToken').value = savedKey;
    }
}

async function saveSettings(event) {
    event.preventDefault();

    const apiToken = document.getElementById('apiToken').value;

    try {
        // Save to backend
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_token: apiToken
            })
        });

        if (response.ok) {
            // Also save to localStorage
            localStorage.setItem('speechify_api_key', apiToken);
            closeSettings();
            showToast('Settings saved successfully', 'success');
        } else {
            showToast('Failed to save settings', 'error');
        }
    } catch (error) {
        showToast('Failed to save settings', 'error');
        console.error('Error saving settings:', error);
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

    // Update UI
    const progressSection = document.getElementById('progressSection');
    const audioSection = document.getElementById('audioSection');

    progressSection.style.display = 'block';
    audioSection.style.display = 'none';

    // Animate progress bar
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                voice: selectedVoice
            })
        });

        const data = await response.json();

        clearInterval(progressInterval);

        if (response.ok) {
            // Complete progress
            progressFill.style.width = '100%';

            setTimeout(() => {
                progressSection.style.display = 'none';
                audioSection.style.display = 'block';

                // Set audio source
                const audioPlayer = document.getElementById('audioPlayer');
                currentAudioUrl = data.download_url;
                audioPlayer.src = `/api/play/${data.filename}`;

                // Set download button
                const downloadBtn = document.getElementById('downloadBtn');
                downloadBtn.onclick = () => {
                    window.location.href = data.download_url;
                };


                showToast('Synthesis complete', 'success');
                loadHistory(); // Refresh history with new file
            }, 500);
        } else {
            showToast(data.error || 'Synthesis failed', 'error');
            progressSection.style.display = 'none';
        }
    } catch (error) {
        clearInterval(progressInterval);
        showToast('Synthesis failed', 'error');
        console.error('Error generating speech:', error);
        progressSection.style.display = 'none';
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Close modal on outside click
window.onclick = function (event) {
    const addVoiceModal = document.getElementById('addVoiceModal');
    const settingsModal = document.getElementById('settingsModal');

    if (event.target === addVoiceModal) {
        closeAddVoiceModal();
    }

    if (event.target === settingsModal) {
        closeSettings();
    }
}
    / /   H i s t o r y   M a n a g e m e n t   F u n c t i o n s 
 
 a s y n c   f u n c t i o n   l o a d H i s t o r y ( )   { 
 
         t r y   { 
 
                 c o n s t   r e s p o n s e   =   a w a i t   f e t c h ( ' / a p i / h i s t o r y ' ) ; 
 
                 c o n s t   d a t a   =   a w a i t   r e s p o n s e . j s o n ( ) ; 
 
 
 
                 d i s p l a y H i s t o r y ( d a t a . f i l e s ) ; 
 
                 u p d a t e H i s t o r y C o u n t ( d a t a . f i l e s . l e n g t h ) ; 
 
         
    }   c a t c h   ( e r r o r )   { 
 
                 c o n s o l e . e r r o r ( ' E r r o r   l o a d i n g   h i s t o r y : ' ,   e r r o r ) ; 
 
         
    } 
 
 
} 
 
 
 
 f u n c t i o n   d i s p l a y H i s t o r y ( f i l e s )   { 
 
         c o n s t   h i s t o r y L i s t   =   d o c u m e n t . g e t E l e m e n t B y I d ( ' h i s t o r y L i s t ' ) ; 
 
 
 
         i f   ( ! f i l e s   | |   f i l e s . l e n g t h   = = =   0 )   { 
 
                 h i s t o r y L i s t . i n n e r H T M L   =   ` 
 
                         < d i v   c l a s s = " e m p t y - s t a t e " > 
 
                                 < s v g   v i e w B o x = " 0   0   2 4   2 4 "   f i l l = " n o n e "   s t r o k e = " c u r r e n t C o l o r "   s t r o k e - w i d t h = " 2 " > 
 
                                         < c i r c l e   c x = " 1 2 "   c y = " 1 2 "   r = " 1 0 " > < / c i r c l e > 
 
                                         < p a t h   d = " M 1 2   6 v 6 l 4   2 " > < / p a t h > 
 
                                 < / s v g > 
 
                                 < p > N O _ H I S T O R Y _ F O U N D < / p > 
 
                                 < s m a l l > G e n e r a t e   y o u r   f i r s t   v o i c e   t o   s e e   i t   h e r e < / s m a l l > 
 
                         < / d i v > 
 
                 ` ; 
 
                 r e t u r n ; 
 
         
    } 
 
 
 
         h i s t o r y L i s t . i n n e r H T M L   =   f i l e s . m a p ( f i l e   = >   { 
 
                 c o n s t   d a t e   =   n e w   D a t e ( f i l e . c r e a t e d   *   1 0 0 0 ) ; 
 
                 c o n s t   d a t e S t r   =   d a t e . t o L o c a l e D a t e S t r i n g ( )   +   '   '   +   d a t e . t o L o c a l e T i m e S t r i n g ( ) ; 
 
                 c o n s t   s i z e K B   =   ( f i l e . s i z e   /   1 0 2 4 ) . t o F i x e d ( 2 ) ; 
 
 
 
                 r e t u r n   ` 
 
                         < d i v   c l a s s = " h i s t o r y - i t e m " > 
 
                                 < d i v   c l a s s = " h i s t o r y - f i l e - i n f o " > 
 
                                         < d i v   c l a s s = " h i s t o r y - f i l e n a m e " > $ { f i l e . f i l e n a m e } < / d i v > 
 
                                         < d i v   c l a s s = " h i s t o r y - m e t a " > 
 
                                                 < s p a n > S I Z E :   $ { s i z e K B }   K B < / s p a n > 
 
                                                 < s p a n > C R E A T E D :   $ { d a t e S t r } < / s p a n > 
 
                                         < / d i v > 
 
                                 < / d i v > 
 
                                 < d i v   c l a s s = " h i s t o r y - a c t i o n s - g r o u p " > 
 
                                         < b u t t o n   c l a s s = " i c o n - a c t i o n - b t n "   o n c l i c k = " p l a y H i s t o r y F i l e ( ' $ { f i l e . f i l e n a m e } ' ) "   t i t l e = " P l a y " > 
 
                                                 < s v g   w i d t h = " 2 0 "   h e i g h t = " 2 0 "   v i e w B o x = " 0   0   2 4   2 4 "   f i l l = " n o n e "   s t r o k e = " c u r r e n t C o l o r "   s t r o k e - w i d t h = " 2 " > 
 
                                                         < p o l y g o n   p o i n t s = " 5   3   1 9   1 2   5   2 1   5   3 " > < / p o l y g o n > 
 
                                                 < / s v g > 
 
                                         < / b u t t o n > 
 
                                         < b u t t o n   c l a s s = " i c o n - a c t i o n - b t n "   o n c l i c k = " d o w n l o a d H i s t o r y F i l e ( ' $ { f i l e . d o w n l o a d _ u r l } ' ) "   t i t l e = " D o w n l o a d " > 
 
                                                 < s v g   w i d t h = " 2 0 "   h e i g h t = " 2 0 "   v i e w B o x = " 0   0   2 4   2 4 "   f i l l = " n o n e "   s t r o k e = " c u r r e n t C o l o r "   s t r o k e - w i d t h = " 2 " > 
 
                                                         < p a t h   d = " M 2 1   1 5 v 4 a 2   2   0   0   1 - 2   2 H 5 a 2   2   0   0   1 - 2 - 2 v - 4 " > < / p a t h > 
 
                                                         < p o l y l i n e   p o i n t s = " 7   1 0   1 2   1 5   1 7   1 0 " > < / p o l y l i n e > 
 
                                                         < l i n e   x 1 = " 1 2 "   y 1 = " 1 5 "   x 2 = " 1 2 "   y 2 = " 3 " > < / l i n e > 
 
                                                 < / s v g > 
 
                                         < / b u t t o n > 
 
                                         < b u t t o n   c l a s s = " i c o n - a c t i o n - b t n   d e l e t e - b t n "   o n c l i c k = " d e l e t e H i s t o r y F i l e ( ' $ { f i l e . f i l e n a m e } ' ) "   t i t l e = " D e l e t e " > 
 
                                                 < s v g   w i d t h = " 2 0 "   h e i g h t = " 2 0 "   v i e w B o x = " 0   0   2 4   2 4 "   f i l l = " n o n e "   s t r o k e = " c u r r e n t C o l o r "   s t r o k e - w i d t h = " 2 " > 
 
                                                         < p o l y l i n e   p o i n t s = " 3   6   5   6   2 1   6 " > < / p o l y l i n e > 
 
                                                         < p a t h   d = " M 1 9   6 v 1 4 a 2   2   0   0   1 - 2   2 H 7 a 2   2   0   0   1 - 2 - 2 V 6 m 3   0 V 4 a 2   2   0   0   1   2 - 2 h 4 a 2   2   0   0   1   2   2 v 2 " > < / p a t h > 
 
                                                 < / s v g > 
 
                                         < / b u t t o n > 
 
                                 < / d i v > 
 
                         < / d i v > 
 
                 ` ; 
 
         
    } ) . j o i n ( ' ' ) ; 
 
 
} 
 
 
 
 f u n c t i o n   u p d a t e H i s t o r y C o u n t ( c o u n t )   { 
 
         c o n s t   b a d g e   =   d o c u m e n t . g e t E l e m e n t B y I d ( ' h i s t o r y C o u n t ' ) ; 
 
         i f   ( c o u n t   >   0 )   { 
 
                 b a d g e . t e x t C o n t e n t   =   c o u n t ; 
 
                 b a d g e . s t y l e . d i s p l a y   =   ' b l o c k ' ; 
 
         
    }   e l s e   { 
 
                 b a d g e . s t y l e . d i s p l a y   =   ' n o n e ' ; 
 
         
    } 
 
 
} 
 
 
 
 f u n c t i o n   o p e n H i s t o r y ( )   { 
 
         l o a d H i s t o r y ( ) ; 
 
         d o c u m e n t . g e t E l e m e n t B y I d ( ' h i s t o r y M o d a l ' ) . s t y l e . d i s p l a y   =   ' f l e x ' ; 
 
 
} 
 
 
 
 f u n c t i o n   c l o s e H i s t o r y ( )   { 
 
         d o c u m e n t . g e t E l e m e n t B y I d ( ' h i s t o r y M o d a l ' ) . s t y l e . d i s p l a y   =   ' n o n e ' ; 
 
 
} 
 
 
 
 f u n c t i o n   p l a y H i s t o r y F i l e ( f i l e n a m e )   { 
 
         c o n s t   a u d i o P l a y e r   =   d o c u m e n t . g e t E l e m e n t B y I d ( ' a u d i o P l a y e r ' ) ; 
 
         a u d i o P l a y e r . s r c   =   ` / a p i / p l a y / $ { f i l e n a m e } ` ; 
 
         a u d i o P l a y e r . p l a y ( ) ; 
 
 
 
         / /   S h o w   a u d i o   s e c t i o n   i f   h i d d e n 
 
         d o c u m e n t . g e t E l e m e n t B y I d ( ' a u d i o S e c t i o n ' ) . s t y l e . d i s p l a y   =   ' b l o c k ' ; 
 
         c l o s e H i s t o r y ( ) ; 
 
 
} 
 
 
 
 f u n c t i o n   d o w n l o a d H i s t o r y F i l e ( u r l )   { 
 
         w i n d o w . l o c a t i o n . h r e f   =   u r l ; 
 
 
} 
 
 
 
 a s y n c   f u n c t i o n   d e l e t e H i s t o r y F i l e ( f i l e n a m e )   { 
 
         i f   ( ! c o n f i r m ( ` D e l e t e   $ { f i l e n a m e } ? ` ) )   { 
 
                 r e t u r n ; 
 
         
    } 
 
 
 
         t r y   { 
 
                 c o n s t   r e s p o n s e   =   a w a i t   f e t c h ( ` / a p i / h i s t o r y / $ { f i l e n a m e } ` ,   { 
 
                         m e t h o d :   ' D E L E T E ' 
 
                 
        } ) ; 
 
 
 
                 i f   ( r e s p o n s e . o k )   { 
 
                         s h o w T o a s t ( ' F i l e   d e l e t e d ' ,   ' s u c c e s s ' ) ; 
 
                         l o a d H i s t o r y ( ) ; 
 
                 
        }   e l s e   { 
 
                         c o n s t   d a t a   =   a w a i t   r e s p o n s e . j s o n ( ) ; 
 
                         s h o w T o a s t ( d a t a . e r r o r   | |   ' F a i l e d   t o   d e l e t e   f i l e ' ,   ' e r r o r ' ) ; 
 
                 
        } 
 
         
    }   c a t c h   ( e r r o r )   { 
 
                 s h o w T o a s t ( ' F a i l e d   t o   d e l e t e   f i l e ' ,   ' e r r o r ' ) ; 
 
                 c o n s o l e . e r r o r ( ' E r r o r   d e l e t i n g   f i l e : ' ,   e r r o r ) ; 
 
         
    } 
 
 
} 
 
 
 
 a s y n c   f u n c t i o n   c l e a r A l l H i s t o r y ( )   { 
 
         i f   ( ! c o n f i r m ( ' D e l e t e   a l l   v o i c e   h i s t o r y ?   T h i s   c a n n o t   b e   u n d o n e . ' ) )   { 
 
                 r e t u r n ; 
 
         
    } 
 
 
 
         t r y   { 
 
                 c o n s t   r e s p o n s e   =   a w a i t   f e t c h ( ' / a p i / h i s t o r y ' ) ; 
 
                 c o n s t   d a t a   =   a w a i t   r e s p o n s e . j s o n ( ) ; 
 
 
 
                 f o r   ( c o n s t   f i l e   o f   d a t a . f i l e s )   { 
 
                         a w a i t   f e t c h ( ` / a p i / h i s t o r y / $ { f i l e . f i l e n a m e } ` ,   {   m e t h o d :   ' D E L E T E '    } ) ; 
 
                 
        } 
 
 
 
                 s h o w T o a s t ( ' A l l   h i s t o r y   c l e a r e d ' ,   ' s u c c e s s ' ) ; 
 
                 l o a d H i s t o r y ( ) ; 
 
         
    }   c a t c h   ( e r r o r )   { 
 
                 s h o w T o a s t ( ' F a i l e d   t o   c l e a r   h i s t o r y ' ,   ' e r r o r ' ) ; 
 
                 c o n s o l e . e r r o r ( ' E r r o r   c l e a r i n g   h i s t o r y : ' ,   e r r o r ) ; 
 
         
    } 
 
 
} 
 
 
 
 / /   A d d   t o   e n d   o f   s c r i p t . j s 
 
 
