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
        announceToScreenReader("High contrast mode on.");
    } else {
        body.removeAttribute('data-theme');
        announceToScreenReader("High contrast mode off.");
    }
});

btnDyslexic.addEventListener('click', () => {
    isDyslexicFont = !isDyslexicFont;
    if(isDyslexicFont) {
        body.setAttribute('data-font', 'dyslexic');
        announceToScreenReader("Dyslexia friendly font on.");
    } else {
        body.removeAttribute('data-font');
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
        playBtn.innerHTML = '<i class="fas fa-volume-up"></i> Padh ke sunao (Play)';
        playBtn.setAttribute('aria-label', 'Read response aloud');
        playBtn.onclick = () => speakText(text);
        
        controls.appendChild(playBtn);
        msgDiv.appendChild(controls);
        
        // Announce to SR
        announceToScreenReader("Sahayak replied: " + text);
    }
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if(!text) return;
    
    appendMessage(text, true);
    userInput.value = '';
    
    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.id = 'loading-msg';
    loadingDiv.textContent = 'Soch raha hoon... (Thinking)';
    chatBox.appendChild(loadingDiv);
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
