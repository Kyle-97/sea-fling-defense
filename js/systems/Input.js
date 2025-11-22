// Input system for Sea Fling Defense
import { GameState } from '../state.js';
import { Projectile } from '../entities/Projectile.js';
import { playBoom } from './Audio.js';
import { spawnFloatingText } from './UI.js';
import { getMainCannonStats } from '../entities/Ship.js';

export function initInput(canvas) {
    canvas.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);

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
    
    const stats = getMainCannonStats();

    // 1. Reload Check
    const now = Date.now();
    if (now - GameState.lastFireTime < stats.cooldown) {
        spawnFloatingText(GameState.ship.x, GameState.ship.y - 50, "RELOADING...", "#9ca3af");
        GameState.isDraggingAmmo = false;
        return;
    }

    const dx = GameState.dragCurrentPos.x - GameState.dragStartPos.x;
    const dy = GameState.dragCurrentPos.y - GameState.dragStartPos.y;
    const dragDist = Math.hypot(dx, dy);

    // 2. Directional Shot (Fixed Speed)
    if (dragDist > 10) { 
        const angle = Math.atan2(dy, dx);
        
        // Constant velocity based on Stats
        const vx = Math.cos(angle) * stats.speed; 
        const vy = Math.sin(angle) * stats.speed;
        
        // isDirect = true (Flat trajectory)
        const p = new Projectile(GameState.ship.x, GameState.ship.y, vx, vy, false, stats.damage, true);
        
        // Set fixed life based on range stat
        p.life = stats.life; 
        
        if (stats.damage > 20) { p.size = 10; }
        
        GameState.projectiles.push(p);
        playBoom();
        GameState.lastFireTime = now; 
    }
    
    GameState.isDraggingAmmo = false;
}