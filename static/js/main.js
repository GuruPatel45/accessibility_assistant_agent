// State and DOM elements
let currentFontSize = 16;
let isHighContrast = false;
let isDyslexicFont = false;
let synth = window.speechSynthesis;

const body = document.body;
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const btnSend = document.getElementById('btn-send');
const btnVoice = document.getElementById('btn-voice');
const srAnnouncer = document.getElementById('sr-announcer');

// Toolbar Buttons
const btnFontInc = document.getElementById('btn-font-increase');
const btnFontDec = document.getElementById('btn-font-decrease');
const btnContrast = document.getElementById('btn-high-contrast');
const btnDyslexic = document.getElementById('btn-dyslexic-font');

// Settings drawer elements
const btnSettingsToggle = document.getElementById('btn-settings-toggle');
const btnDrawerClose = document.getElementById('btn-drawer-close');
const drawer = document.getElementById('a11y-drawer');
const drawerBackdrop = document.getElementById('drawer-backdrop');

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

// ----- Accessibility Toolbar Logic -----

btnFontInc.addEventListener('click', () => {
    if(currentFontSize < 32) {
        currentFontSize += 2;
        document.documentElement.style.setProperty('--font-base', `${currentFontSize}px`);
        announceToScreenReader(`Font size increased to ${currentFontSize} pixels.`);
    }
});

btnFontDec.addEventListener('click', () => {
    if(currentFontSize > 12) {
        currentFontSize -= 2;
        document.documentElement.style.setProperty('--font-base', `${currentFontSize}px`);
        announceToScreenReader(`Font size decreased to ${currentFontSize} pixels.`);
    }
});

btnContrast.addEventListener('click', () => {
    isHighContrast = !isHighContrast;
    if(isHighContrast) {
        body.setAttribute('data-theme', 'high-contrast');
        btnContrast.classList.add('active');
        announceToScreenReader("High contrast mode on.");
    } else {
        body.removeAttribute('data-theme');
        btnContrast.classList.remove('active');
        announceToScreenReader("High contrast mode off.");
    }
});

btnDyslexic.addEventListener('click', () => {
    isDyslexicFont = !isDyslexicFont;
    if(isDyslexicFont) {
        body.setAttribute('data-font', 'dyslexic');
        btnDyslexic.classList.add('active');
        announceToScreenReader("Dyslexia friendly font on.");
    } else {
        body.removeAttribute('data-font');
        btnDyslexic.classList.remove('active');
        announceToScreenReader("Dyslexia friendly font off.");
    }
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
    utterance.lang = 'hi-IN'; // Defaulting to Hindi/Indian accent English
    synth.speak(utterance);
}

// ----- Web Speech API (Voice Input) -----

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;

    btnVoice.addEventListener('click', () => {
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
                accessibility_mode: isHighContrast ? 'visual' : 'standard'
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
