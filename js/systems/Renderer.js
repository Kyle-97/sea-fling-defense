// Renderer system for Sea Fling Defense
import { CONFIG } from '../constants.js';
import { GameState } from '../state.js';

export function drawGame(ctx, canvas) {
    ctx.clearRect(0,0,canvas.width, canvas.height);

    if (GameState.inMenu) {
        drawSea(ctx, canvas);
        drawShip(ctx);
    } else if (GameState.inPort) {
        drawPortScenery(ctx, canvas);
        drawShip(ctx);
    } else {
        drawSea(ctx, canvas);
        drawShip(ctx);
        GameState.splashes.forEach(s => drawSplash(ctx, s));
        GameState.enemies.forEach(e => drawEnemy(ctx, e));
        GameState.projectiles.forEach(p => p.draw(ctx)); // Assuming Projectile.draw handles internal logic or move it here
        GameState.enemyProjectiles.forEach(p => p.draw(ctx));
        GameState.particles.forEach(p => drawParticle(ctx, p));
    }
}

let wavesOffset = 0;
function drawSea(ctx, canvas) {
    wavesOffset = (wavesOffset + 1) % 40;
    ctx.fillStyle = CONFIG.seaColor; ctx.fillRect(0,0,canvas.width, canvas.height);
    ctx.strokeStyle = CONFIG.waveColor; ctx.lineWidth = 2; ctx.beginPath();
    for(let y = -40; y < canvas.height; y += 40) {
        const drawY = y + wavesOffset;
        for(let x = 0; x < canvas.width; x += 40) {
            ctx.moveTo(x, drawY); ctx.quadraticCurveTo(x+10, drawY-5, x+20, drawY); ctx.quadraticCurveTo(x+30, drawY+5, x+40, drawY);
        }
    }
    ctx.stroke();
}

function drawShip(ctx) {
    const ship = GameState.ship;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.rotation);
    
    // ... Ship drawing logic from lines 855-884 ...
    ctx.fillStyle = CONFIG.shipColor; 
    ctx.beginPath(); ctx.ellipse(0, 0, ship.w/2, ship.h/2, 0, 0, Math.PI*2); ctx.fill();
    
    // Draw Cannons
    ship.cannons.forEach((cannon) => {
        if(!ship.slots[cannon.slotIndex]) return;
        const slot = ship.slots[cannon.slotIndex];
        ctx.save();
        ctx.translate(slot.x, slot.y);
        ctx.rotate(slot.angle);
        // ... cannon drawing ...
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    });

    ctx.restore();
}

// Add drawEnemy, drawParticle, drawPortScenery helper functions here...