// Input system for Sea Fling Defense
import { GameState } from '../state.js';
import { Projectile } from '../entities/Projectile.js';
import { playBoom } from './Audio.js';

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
    
    // Check if touching near ship
    const dist = Math.hypot(x - GameState.ship.x, y - GameState.ship.y);
    if (dist < 100) { 
        GameState.isDraggingAmmo = true;
        
        // Hide the tutorial guide if it exists
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
    
    const now = Date.now();
    const dt = now - GameState.dragStartPos.time;
    const dx = GameState.dragCurrentPos.x - GameState.dragStartPos.x;
    const dy = GameState.dragCurrentPos.y - GameState.dragStartPos.y;
    
    // Physics Calculation (Fling logic)
    const timeFactor = Math.max(dt, 40); 
    const power = 40; 
    let vx = (dx / timeFactor) * power; 
    let vy = (dy / timeFactor) * power;
    
    const mag = Math.hypot(vx, vy);
    
    // Only fire if drag was significant enough
    if (mag > 3) { 
        const maxSpeed = 16;
        // Cap speed
        if (mag > maxSpeed) { 
            const ratio = maxSpeed / mag; 
            vx *= ratio; 
            vy *= ratio; 
        }
        
        // Create Projectile
        GameState.projectiles.push(new Projectile(GameState.ship.x, GameState.ship.y, vx, vy));
        playBoom();
    }
    
    GameState.isDraggingAmmo = false;
}