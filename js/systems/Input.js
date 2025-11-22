// Input system for Sea Fling Defense
import { GameState } from '../state.js';
import { Projectile } from '../entities/Projectile.js';
import { playBoom } from './Audio.js';
import { spawnFloatingText } from './UI.js';
import { getHeroReloadTime } from '../entities/Ship.js'; // Import the helper

export function initInput(canvas) {
    // Mouse Events
    canvas.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);

    // Touch Events
    canvas.addEventListener('touchstart', (e) => {
        if(e.target === canvas) e.preventDefault();
        startDrag(e.changedTouches[0]);
    }, {passive: false});

    window.addEventListener('touchmove', (e) => {
        if(GameState.isDraggingAmmo) e.preventDefault();
        moveDrag(e.changedTouches[0]);
    }, {passive: false});
    
    window.addEventListener('touchend', (e) => endDrag(e.changedTouches[0]));
}

function startDrag(e) {
    if(GameState.isPaused || !GameState.gameActive || GameState.ship.sinking || GameState.inPort || GameState.inMenu) return;
    
    const x = e.clientX || e.pageX;
    const y = e.clientY || e.pageY;
    
    const dist = Math.hypot(x - GameState.ship.x, y - GameState.ship.y);
    if (dist < 100) { 
        GameState.isDraggingAmmo = true;
        const guide = document.getElementById('touchGuide');
        if(guide) guide.style.display = 'none';
        
        GameState.dragStartPos = { x: x, y: y, time: Date.now() }; 
        GameState.dragCurrentPos = { x: x, y: y };
    }
}

function moveDrag(e) {
    if (!GameState.isDraggingAmmo) return;
    const x = e.clientX || e.pageX; 
    const y = e.clientY || e.pageY;
    GameState.dragCurrentPos = { x: x, y: y };
}

function endDrag(e) {
    if (!GameState.isDraggingAmmo) return;
    
    // --- RELOAD CHECK ---
    const now = Date.now();
    const cooldownMs = getHeroReloadTime(); // Use shared helper
    
    if (now - GameState.lastFireTime < cooldownMs) {
        spawnFloatingText(GameState.ship.x, GameState.ship.y - 50, "RELOADING...", "#9ca3af");
        GameState.isDraggingAmmo = false;
        return;
    }
    // --------------------

    const dt = now - GameState.dragStartPos.time;
    const dx = GameState.dragCurrentPos.x - GameState.dragStartPos.x;
    const dy = GameState.dragCurrentPos.y - GameState.dragStartPos.y;
    
    // Physics Calculation (Fling logic)
    const timeFactor = Math.max(dt, 40); 
    const power = 25; // Slower projectiles
    let vx = (dx / timeFactor) * power; 
    let vy = (dy / timeFactor) * power;
    
    const mag = Math.hypot(vx, vy);
    
    if (mag > 3) { 
        const maxSpeed = 10;
        if (mag > maxSpeed) { 
            const ratio = maxSpeed / mag; 
            vx *= ratio; 
            vy *= ratio; 
        }
        
        GameState.projectiles.push(new Projectile(GameState.ship.x, GameState.ship.y, vx, vy));
        playBoom();
        GameState.lastFireTime = now; 
    }
    
    GameState.isDraggingAmmo = false;
}