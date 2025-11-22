// Input system for Sea Fling Defense
import { GameState } from '../state.js';
import { Projectile } from '../entities/Projectile.js';
import { playBoom } from './Audio.js';

let isDraggingAmmo = false;
let dragStartPos = { x: 0, y: 0, time: 0 };
let dragCurrentPos = { x: 0, y: 0 };

export function initInput(canvas) {
    canvas.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);
    // Add touch listeners...
}

function startDrag(e) {
    if(GameState.isPaused || !GameState.gameActive) return;
    // ... logic ...
    isDraggingAmmo = true;
    // ...
}

function moveDrag(e) {
    if (!isDraggingAmmo) return;
    // ...
}

function endDrag(e) {
    if (!isDraggingAmmo) return;
    // Calculate flick vector and spawn Projectile
    // GameState.projectiles.push(new Projectile(...));
    isDraggingAmmo = false;
}