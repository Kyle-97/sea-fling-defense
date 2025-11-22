// Entry point for Sea Fling Defense
import { GameState } from './state.js';
import { CONFIG } from './constants.js';
import { initInput } from './systems/Input.js';
import { drawGame } from './systems/Renderer.js';
import { initAudio, toggleMusic } from './systems/Audio.js';
import { updateShipStats, updateCaptain, updateCrewLogistics } from './entities/Ship.js';
import { updateHUD, initShop, spawnFloatingText } from './systems/UI.js';
import { Enemy } from './entities/Enemy.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Flow Control ---

function startGame(startWave) {
    GameState.wave = startWave - 1; 
    
    // Set starting gold based on difficulty
    // CHANGED: Give 100g head start on Wave 1 (was 0)
    if (startWave === 1) GameState.gold = 100;
    else if (startWave === 10) GameState.gold = 3000;
    else if (startWave === 20) GameState.gold = 8000;
    else if (startWave === 30) GameState.gold = 15000;
    else if (startWave === 40) GameState.gold = 25000;

    GameState.inMenu = false;
    document.getElementById('startMenu').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    
    updateHUD();
    enterPort(); 
}

function enterPort() {
    GameState.inPort = true;
    GameState.gameActive = false;
    document.getElementById('portUI').style.display = 'flex';
    document.getElementById('portGold').innerText = GameState.gold;
    initShop(); 
}

export function leavePort() {
    initAudio(); 
    GameState.inPort = false;
    GameState.gameActive = true;
    document.getElementById('portUI').style.display = 'none';
    startNextWave();
}

function startNextWave() {
    GameState.wave++;
    
    // Boss Wave Logic
    if (GameState.wave % 5 === 0) {
        GameState.enemiesToSpawn = 1;
        spawnFloatingText(GameState.ship.x, GameState.ship.y - 100, "BOSS WAVE!", "#ff0000");
    } else {
        // CHANGED: Gentler scaling. Was 5 + (wave * 2).
        // Now starts at 5 (4+1) and grows by 1 per wave.
        GameState.enemiesToSpawn = 4 + GameState.wave;
        spawnFloatingText(GameState.ship.x, GameState.ship.y - 100, `WAVE ${GameState.wave}`, "#ffff00");
    }
    
    CONFIG.enemySpawnRate = Math.max(100, 300 - (GameState.wave * 5)); 
    document.getElementById('waveDisplay').innerText = GameState.wave;
}

function spawnWaveLogic() {
    if(GameState.ship.sinking || GameState.inPort || GameState.inMenu) return;
    
    GameState.spawnTimer++;
    if (GameState.spawnTimer > CONFIG.enemySpawnRate && GameState.enemiesToSpawn > 0) {
        GameState.spawnTimer = 0;
        
        let type = 'raft';
        if (GameState.wave % 5 === 0 && GameState.enemiesToSpawn === 1) {
             type = 'boss';
        } else {
            if (GameState.wave > 2 && Math.random() < 0.4) type = 'gunboat';
            if (GameState.wave > 4 && Math.random() < 0.2) type = 'serpent';
        }
        
        GameState.enemies.push(new Enemy(type, canvas.width, canvas.height, GameState.wave));
        GameState.enemiesToSpawn--;
    }
    
    if (GameState.enemiesToSpawn === 0 && GameState.enemies.length === 0) {
        enterPort();
    }
    
    document.getElementById('enemyCount').innerText = GameState.enemies.length + GameState.enemiesToSpawn;
}

function resetGame() {
    GameState.reset();
    updateShipStats();
    
    document.getElementById('startMenu').style.display = 'flex';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('portUI').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
}

function togglePause() {
    if (!GameState.gameActive || GameState.ship.sinking || GameState.inPort || GameState.inMenu) return;
    GameState.isPaused = !GameState.isPaused;
    document.getElementById('pauseScreen').style.display = GameState.isPaused ? 'flex' : 'none';
}

// --- Initialization ---

function setupEventListeners() {
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const wave = parseInt(btn.getAttribute('data-wave'));
            startGame(wave);
        });
    });

    document.getElementById('musicBtn').addEventListener('click', toggleMusic);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('sailBtn').addEventListener('click', leavePort);
    document.getElementById('resumeBtn').addEventListener('click', togglePause);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if(GameState.inMenu) {
        GameState.ship.x = canvas.width / 2;
        GameState.ship.y = canvas.height * 0.6;
    }
}

function gameLoop() {
    if (GameState.gameActive && !GameState.isPaused) {
        GameState.frameCount++;
        
        spawnWaveLogic();
        updateCaptain();
        updateCrewLogistics(); 
        
        GameState.enemies.forEach(e => e.update(GameState.ship, canvas.width, canvas.height));
        GameState.projectiles.forEach(p => p.update());
        GameState.enemyProjectiles.forEach(p => p.update());
        GameState.particles.forEach(p => p.update());
        GameState.splashes.forEach(s => s.update());
        
        GameState.enemies = GameState.enemies.filter(e => !e.dead);
        GameState.projectiles = GameState.projectiles.filter(p => p.active);
        GameState.enemyProjectiles = GameState.enemyProjectiles.filter(p => p.active);
        GameState.particles = GameState.particles.filter(p => p.life > 0);
        GameState.splashes = GameState.splashes.filter(s => s.life > 0);
        
        if(GameState.ship.sinking) {
             GameState.gameActive = false;
             document.getElementById('finalWave').innerText = GameState.wave;
             document.getElementById('gameOverScreen').style.display = 'flex';
        }
    }
    
    drawGame(ctx, canvas);
    requestAnimationFrame(gameLoop);
}

function init() {
    resize();
    window.addEventListener('resize', resize);
    initInput(canvas);
    setupEventListeners(); 
    updateShipStats();
    requestAnimationFrame(gameLoop);
}

init();