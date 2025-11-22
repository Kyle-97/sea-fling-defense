// Audio system for Sea Fling Defense
import { SHANTY_NOTES } from '../constants.js';

// Internal State
let audioCtx = null;
let musicPlaying = false;
let noteIdx = 0;
let musicTimer = null;

// --- Internal Helper ---
function safeAudioCall(callback) {
    if(!audioCtx) return;
    try { callback(); } catch(e) { console.warn("Audio Error:", e); }
}

// --- Exported Functions ---

export function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
}

export function toggleMusic() {
    initAudio();
    musicPlaying = !musicPlaying;
    
    // Update Button UI if it exists
    const btn = document.getElementById('musicBtn');
    if(btn) btn.style.opacity = musicPlaying ? '1' : '0.5';
    
    if(musicPlaying) musicLoop(); 
    else clearTimeout(musicTimer);
}

function musicLoop() {
    if(!musicPlaying) return;
    safeAudioCall(() => {
        const freq = SHANTY_NOTES[noteIdx % SHANTY_NOTES.length];
        const duration = (noteIdx % 4 === 3) ? 0.8 : 0.4;
        const osc1 = audioCtx.createOscillator(); 
        const osc2 = audioCtx.createOscillator(); 
        const gain = audioCtx.createGain();
        
        osc1.type = 'sawtooth'; 
        osc2.type = 'square'; 
        osc1.frequency.value = freq; 
        osc2.frequency.value = freq * 2; 
        osc2.detune.value = 10;
        
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + duration - 0.1);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
        
        osc1.connect(gain); 
        osc2.connect(gain); 
        gain.connect(audioCtx.destination);
        
        osc1.start(); 
        osc2.start(); 
        osc1.stop(audioCtx.currentTime + duration); 
        osc2.stop(audioCtx.currentTime + duration);
        
        noteIdx++;
        musicTimer = setTimeout(musicLoop, duration * 1000);
    });
}

export function playBoom(isSmall = false) {
    safeAudioCall(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(isSmall ? 120 : 60, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.6);
        gain.gain.setValueAtTime(isSmall ? 0.2 : 0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.6);
    });
}

export function playSplash() {
    safeAudioCall(() => {
        const bufferSize = audioCtx.sampleRate * 0.5;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.4);
        const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        noise.start();
    });
}

export function playCrunch() {
    safeAudioCall(() => {
        const bufferSize = audioCtx.sampleRate * 0.2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i/bufferSize);
        const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass';
        filter.frequency.value = 1000;
        const gain = audioCtx.createGain(); gain.gain.value = 0.5;
        noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        noise.start();
    });
}