// Entry point for Sea Fling Defense
import { GameState } from './state.js';
import { CONFIG } from './constants.js';
import { initInput } from './systems/Input.js';
import { drawGame } from './systems/Renderer.js';
import { initAudio } from './systems/Audio.js';
import { updateShipStats, updateCaptain } from './entities/Ship.js';
import { updateHUD, initShop } from './systems/UI.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    GameState.ship.x = canvas.width / 2;
    GameState.ship.y = canvas.height * 0.6;
}

function gameLoop() {
    if (GameState.gameActive && !GameState.isPaused) {
        GameState.frameCount++;
        updateCaptain();
        // Update entities...
        GameState.enemies.forEach(e => e.update(GameState.ship, canvas.width, canvas.height));
        GameState.projectiles.forEach(p => p.update());
        // Filter dead entities
        GameState.enemies = GameState.enemies.filter(e => !e.dead);
    }
    
    drawGame(ctx, canvas);
    requestAnimationFrame(gameLoop);
}

function init() {
    resize();
    window.addEventListener('resize', resize);
    initInput(canvas);
    updateShipStats();
    requestAnimationFrame(gameLoop);
}

init();