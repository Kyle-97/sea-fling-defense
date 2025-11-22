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
        const t = audioCtx.currentTime;
        
        // 1. The Explosion (Filtered Noise) - "The Blast"
        const bufferSize = audioCtx.sampleRate * 1.0; 
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        // Start high for the "CRACK", drop low for the "RUMBLE"
        noiseFilter.frequency.setValueAtTime(1000, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(50, t + 0.5);
        
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.8, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noise.start();
        
        // 2. The Thump (Sub-bass Oscillator) - "The Body"
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        
        osc.type = 'triangle'; // Triangle has more punch than sine
        osc.frequency.setValueAtTime(isSmall ? 100 : 60, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 0.5); // Deep frequency drop
        
        oscGain.gain.setValueAtTime(1.0, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        
        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);
        osc.start();
        osc.stop(t + 0.6);
    });
}

export function playReload() {
    safeAudioCall(() => {
        const t = audioCtx.currentTime;
        
        // "Rechambering" Effect: Slide + Lock
        
        // Part 1: The Slide (Metal friction)
        // Bandpassed noise creates a "scraping" texture
        const bufferSize = audioCtx.sampleRate * 0.2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(2500, t); // High pitched scrape
        noiseFilter.Q.value = 1.5;
        
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.3, t);
        noiseGain.gain.linearRampToValueAtTime(0, t + 0.08); // Very short slide
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noise.start();
        
        // Part 2: The Lock (Bolt clicking home)
        // A short, sharp sawtooth drop
        const lockTime = t + 0.1; // Delay for the second part
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        
        osc.type = 'sawtooth'; // Sawtooth sounds metallic/harsh
        osc.frequency.setValueAtTime(600, lockTime);
        osc.frequency.exponentialRampToValueAtTime(100, lockTime + 0.08); // Rapid pitch drop = "Click"
        
        oscGain.gain.setValueAtTime(0.2, lockTime);
        oscGain.gain.exponentialRampToValueAtTime(0.01, lockTime + 0.08);
        
        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);
        osc.start(lockTime);
        osc.stop(lockTime + 0.1);
    });
}

export function playWoodHit() {
    safeAudioCall(() => {
        // 1. The "Thud" (Metal ball impact)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(80, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);

        // 2. The "Crunch" (Wood breaking)
        const bufferSize = audioCtx.sampleRate * 0.3;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 500; 

        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noise.start();
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