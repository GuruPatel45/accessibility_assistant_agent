// State and DOM elements
let isDarkTheme = false;
let isAutoRead = false;
let isEasyMode = false;
let voiceLang = 'hi-IN'; // 'hi-IN' or 'en-IN'
let synth = window.speechSynthesis;

const body = document.body;
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const btnSend = document.getElementById('btn-send');
const btnVoice = document.getElementById('btn-voice');
const srAnnouncer = document.getElementById('sr-announcer');

// Header actions
const btnThemeToggle = document.getElementById('btn-theme-toggle');

// Drawer feature buttons
const btnAutoRead = document.getElementById('btn-auto-read');
const btnEasyMode = document.getElementById('btn-easy-mode');
const btnVoiceLang = document.getElementById('btn-voice-lang');
const voiceLangLabel = document.getElementById('voice-lang-label');
const btnClearChat = document.getElementById('btn-clear-chat');

// Settings drawer elements
const btnSettingsToggle = document.getElementById('btn-settings-toggle');
const btnDrawerClose = document.getElementById('btn-drawer-close');
const drawer = document.getElementById('a11y-drawer');
const drawerBackdrop = document.getElementById('drawer-backdrop');

const WELCOME_HTML = `<div class="message-row ai-row">
    <div class="avatar ai-avatar" aria-hidden="true"><i class="fa-solid fa-robot"></i></div>
    <div class="message ai-message" tabindex="0">
        Namaste! Main aapka Smart Accessibility Assistant hoon. Main aapko sarkari yojnaon (jaise UDID aur Pension) ki jaankari dene aur kisi bhi jatil (complex) jankari ko aasaan bhasha me samjhane me madad kar sakta hoon. Batiye, aaj main aapki kya sahayata karoon?
    </div>
</div>`;

// ----- Load saved preferences -----
function loadPreferences() {
    try {
        if (localStorage.getItem('a11y-theme') === 'dark') {
            isDarkTheme = true;
        }
        isAutoRead = localStorage.getItem('a11y-auto-read') === 'true';
        isEasyMode = localStorage.getItem('a11y-easy-mode') === 'true';
        voiceLang = localStorage.getItem('a11y-voice-lang') || 'hi-IN';
    } catch (e) {
        // localStorage unavailable, fall back to defaults
    }

    applyTheme();
    applyAutoRead();
    applyEasyMode();
    applyVoiceLang();
}

// ----- Theme (Light / Dark) -----
function applyTheme() {
    if (isDarkTheme) {
        body.setAttribute('data-theme', 'dark');
        btnThemeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        btnThemeToggle.setAttribute('aria-pressed', 'true');
        btnThemeToggle.setAttribute('aria-label', 'Light theme on karein');
    } else {
        body.removeAttribute('data-theme');
        btnThemeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        btnThemeToggle.setAttribute('aria-pressed', 'false');
        btnThemeToggle.setAttribute('aria-label', 'Dark theme on karein');
    }
}

btnThemeToggle.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    try { localStorage.setItem('a11y-theme', isDarkTheme ? 'dark' : 'light'); } catch (e) {}
    applyTheme();
    announceToScreenReader(isDarkTheme ? "Dark theme on." : "Light theme on.");
});

// ----- Accessibility Drawer (bottom sheet) Logic -----

function openDrawer() {
    drawer.classList.add('open');
    drawerBackdrop.classList.add('show');
    btnSettingsToggle.setAttribute('aria-expanded', 'true');
}

function closeDrawer() {
    drawer.classList.remove('open');
    drawerBackdrop.classList.remove('show');
    btnSettingsToggle.setAttribute('aria-expanded', 'false');
}

btnSettingsToggle.addEventListener('click', () => {
    if (drawer.classList.contains('open')) {
        closeDrawer();
    } else {
        openDrawer();
    }
});

btnDrawerClose.addEventListener('click', closeDrawer);
drawerBackdrop.addEventListener('click', closeDrawer);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
        closeDrawer();
    }
});

// ----- Auto-Read AI replies -----
function applyAutoRead() {
    btnAutoRead.classList.toggle('active', isAutoRead);
    btnAutoRead.setAttribute('aria-pressed', String(isAutoRead));
}

btnAutoRead.addEventListener('click', () => {
    isAutoRead = !isAutoRead;
    try { localStorage.setItem('a11y-auto-read', String(isAutoRead)); } catch (e) {}
    applyAutoRead();
    announceToScreenReader(isAutoRead ? "Auto-read on. Jawab khud sunaya jayega." : "Auto-read off.");
});

// ----- Saral Bhasha (Easy / Cognitive-simplified) mode -----
function applyEasyMode() {
    btnEasyMode.classList.toggle('active', isEasyMode);
    btnEasyMode.setAttribute('aria-pressed', String(isEasyMode));
}

btnEasyMode.addEventListener('click', () => {
    isEasyMode = !isEasyMode;
    try { localStorage.setItem('a11y-easy-mode', String(isEasyMode)); } catch (e) {}
    applyEasyMode();
    announceToScreenReader(isEasyMode ? "Saral bhasha mode on." : "Saral bhasha mode off.");
});

// ----- Voice language (Hindi / English) -----
function applyVoiceLang() {
    voiceLangLabel.textContent = voiceLang === 'hi-IN' ? 'Hindi Awaaz' : 'English Voice';
    btnVoiceLang.setAttribute('aria-label', voiceLang === 'hi-IN' ? 'Awaaz English mein badlein' : 'Switch voice to Hindi');
    if (typeof recognition !== 'undefined' && recognition) {
        recognition.lang = voiceLang;
    }
}

btnVoiceLang.addEventListener('click', () => {
    voiceLang = voiceLang === 'hi-IN' ? 'en-IN' : 'hi-IN';
    try { localStorage.setItem('a11y-voice-lang', voiceLang); } catch (e) {}
    applyVoiceLang();
    announceToScreenReader(voiceLang === 'hi-IN' ? "Voice language set to Hindi." : "Voice language set to English.");
});

// ----- Clear / Naya Chat -----
btnClearChat.addEventListener('click', () => {
    chatBox.innerHTML = WELCOME_HTML;
    announceToScreenReader("Naya chat shuru hua.");
    closeDrawer();
});

function announceToScreenReader(text) {
    srAnnouncer.textContent = text;
    // Clear after a moment so it can be announced again if needed
    setTimeout(() => { srAnnouncer.textContent = ""; }, 3000);
}

// ----- Text-to-Speech (TTS) -----

function speakText(text) {
    if(synth.speaking) {
        synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLang;
    synth.speak(utterance);
}

// ----- Web Speech API (Voice Input) -----

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.interimResults = false;

    btnVoice.addEventListener('click', () => {
        recognition.lang = voiceLang;
        recognition.start();
        btnVoice.classList.add('recording');
        announceToScreenReader("Listening for voice input.");
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        announceToScreenReader("Voice input received. Press send to submit.");
    };

    recognition.onspeechend = () => {
        recognition.stop();
        btnVoice.classList.remove('recording');
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        btnVoice.classList.remove('recording');
        announceToScreenReader("Sorry, voice input failed.");
    };
} else {
    btnVoice.style.display = 'none'; // Hide if not supported
}

// ----- Chat Logic -----

function appendMessage(text, isUser = false) {
    const row = document.createElement('div');
    row.className = `message-row ${isUser ? 'user-row' : 'ai-row'}`;

    // AI messages get a small avatar bubble
    if (!isUser) {
        const avatar = document.createElement('div');
        avatar.className = 'avatar ai-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.innerHTML = '<i class="fa-solid fa-robot"></i>';
        row.appendChild(avatar);
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    msgDiv.tabIndex = 0; // Make focusable for keyboard users

    // Convert basic markdown/newlines to HTML
    let formattedText = text.replace(/\n/g, '<br>');

    msgDiv.innerHTML = formattedText;

    if(!isUser) {
        // Add Play Audio button for AI responses
        const controls = document.createElement('div');
        controls.className = 'message-controls';

        const playBtn = document.createElement('button');
        playBtn.innerHTML = '<i class="fas fa-volume-up"></i> Padh ke sunao';
        playBtn.setAttribute('aria-label', 'Read response aloud');
        playBtn.onclick = () => speakText(text);

        controls.appendChild(playBtn);
        msgDiv.appendChild(controls);

        // Announce to SR
        announceToScreenReader("Sahayak replied: " + text);

        // Auto-read if enabled
        if (isAutoRead) {
            speakText(text);
        }
    }

    row.appendChild(msgDiv);
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if(!text) return;

    appendMessage(text, true);
    userInput.value = '';

    // Add animated typing indicator
    const loadingRow = document.createElement('div');
    loadingRow.className = 'message-row ai-row';
    loadingRow.id = 'loading-msg';

    const loadingAvatar = document.createElement('div');
    loadingAvatar.className = 'avatar ai-avatar';
    loadingAvatar.setAttribute('aria-hidden', 'true');
    loadingAvatar.innerHTML = '<i class="fa-solid fa-robot"></i>';

    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'message ai-message';
    loadingBubble.innerHTML = '<div class="typing-dots" aria-label="Soch raha hoon"><span></span><span></span><span></span></div>';

    loadingRow.appendChild(loadingAvatar);
    loadingRow.appendChild(loadingBubble);
    chatBox.appendChild(loadingRow);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: text,
                accessibility_mode: isEasyMode ? 'cognitive' : 'standard'
            })
        });

        const data = await response.json();

        // Remove loading
        document.getElementById('loading-msg').remove();

        if(data.response) {
            appendMessage(data.response, false);
        }
    } catch (error) {
        document.getElementById('loading-msg').remove();
        appendMessage("Maaf kijiye, server se connect nahi ho pa raha hai.", false);
        console.error("Chat error:", error);
    }
}

btnSend.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        sendMessage();
    }
});

// Initialize saved preferences on load
loadPreferences();
