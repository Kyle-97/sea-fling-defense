// Input system for Sea Fling Defense
import { GameState } from '../state.js';
import { Projectile } from '../entities/Projectile.js';
import { playBoom } from './Audio.js';
import { spawnFloatingText } from './UI.js';
import { getMainCannonStats } from '../entities/Ship.js';
import { CONFIG } from '../constants.js';

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

function getLogicPos(e) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const screenX = e.clientX || e.pageX;
    const screenY = e.clientY || e.pageY;
    const x = (screenX - cx) / CONFIG.zoom + cx;
    const y = (screenY - cy) / CONFIG.zoom + cy;
    return { x, y };
}

function startDrag(e) {
    if(GameState.isPaused || !GameState.gameActive || GameState.ship.sinking || GameState.inPort || GameState.inMenu) return;
    
    const pos = getLogicPos(e);
    
    const dist = Math.hypot(pos.x - GameState.ship.x, pos.y - GameState.ship.y);
    if (dist < 100) { 
        GameState.isDraggingAmmo = true;
        const guide = document.getElementById('touchGuide');
        if(guide) guide.style.display = 'none';
        
        GameState.dragStartPos = { x: pos.x, y: pos.y, time: Date.now() }; 
        GameState.dragCurrentPos = { x: pos.x, y: pos.y };
    }
}

function moveDrag(e) {
    if (!GameState.isDraggingAmmo) return;
    const pos = getLogicPos(e);
    GameState.dragCurrentPos = { x: pos.x, y: pos.y };
}

function endDrag(e) {
    if (!GameState.isDraggingAmmo) return;
    
    const stats = getMainCannonStats();
    const now = Date.now();
    if (now - GameState.lastFireTime < stats.cooldown) {
        spawnFloatingText(GameState.ship.x, GameState.ship.y - 50, "RELOADING...", "#9ca3af");
        GameState.isDraggingAmmo = false;
        return;
    }

    const dx = GameState.dragCurrentPos.x - GameState.dragStartPos.x;
    const dy = GameState.dragCurrentPos.y - GameState.dragStartPos.y;
    const dragDist = Math.hypot(dx, dy);

    if (dragDist > 10) { 
        const angle = Math.atan2(dy, dx);
        const vx = Math.cos(angle) * stats.speed; 
        const vy = Math.sin(angle) * stats.speed;
        
        // --- AMMO LOGIC ---
        if (GameState.ship.ammo === 'grape') {
            // Fire 3 shots with spread
            for(let i = -1; i <= 1; i++) {
                const spreadAngle = angle + (i * 0.15); // 0.15 radians spread
                const svx = Math.cos(spreadAngle) * stats.speed;
                const svy = Math.sin(spreadAngle) * stats.speed;
                
                const p = new Projectile(GameState.ship.x, GameState.ship.y, svx, svy, false, stats.damage, true);
                p.life = stats.life * (0.8 + Math.random() * 0.4); // Randomize range slightly
                p.size = 6; 
                GameState.projectiles.push(p);
            }
        } else {
            // Standard / Heavy
            const p = new Projectile(GameState.ship.x, GameState.ship.y, vx, vy, false, stats.damage, true);
            p.life = stats.life; 
            
            if (GameState.ship.ammo === 'heavy') {
                p.size = 12; // Big ball
            } else if (stats.damage > 20) { 
                p.size = 10; 
            }
            
            GameState.projectiles.push(p);
        }
        // ------------------

        playBoom();
        GameState.lastFireTime = now;
        GameState.reloadSoundPlayed = false; // Flag sound as needed
    }
    
    GameState.isDraggingAmmo = false;
}