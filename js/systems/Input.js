// Input system for Sea Fling Defense
import { GameState } from '../state.js';
import { Projectile } from '../entities/Projectile.js';
import { playBoom } from './Audio.js';
import { spawnFloatingText } from './UI.js';
import { getMainCannonStats } from '../entities/Ship.js';

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
    
    // --- DYNAMIC STATS CHECK ---
    const stats = getMainCannonStats();
    // ---------------------------

    const now = Date.now();
    // 1. Reload Check using dynamic cooldown
    if (now - GameState.lastFireTime < stats.cooldown) {
        spawnFloatingText(GameState.ship.x, GameState.ship.y - 50, "RELOADING...", "#9ca3af");
        GameState.isDraggingAmmo = false;
        return;
    }

    // 2. Physics & Power
    const dt = now - GameState.dragStartPos.time;
    const dx = GameState.dragCurrentPos.x - GameState.dragStartPos.x;
    const dy = GameState.dragCurrentPos.y - GameState.dragStartPos.y;
    
    const timeFactor = Math.max(dt, 40); 
    
    // Use dynamic powerScale
    let vx = (dx / timeFactor) * stats.powerScale; 
    let vy = (dy / timeFactor) * stats.powerScale;
    
    const mag = Math.hypot(vx, vy);
    
    if (mag > 3) { 
        // Use dynamic maxSpeed (range cap)
        if (mag > stats.maxSpeed) { 
            const ratio = stats.maxSpeed / mag; 
            vx *= ratio; 
            vy *= ratio; 
        }
        
        // Use dynamic damage
        const p = new Projectile(GameState.ship.x, GameState.ship.y, vx, vy, false, stats.damage);
        
        // Visual feedback for powerful shots
        if (stats.damage > 20) { p.size = 10; }
        
        GameState.projectiles.push(p);
        playBoom();
        GameState.lastFireTime = now; 
    }
    
    GameState.isDraggingAmmo = false;
}