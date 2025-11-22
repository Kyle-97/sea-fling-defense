// Renderer system for Sea Fling Defense
import { CONFIG } from '../constants.js';
import { GameState } from '../state.js';

// --- Main Render Loop ---

export function drawGame(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (GameState.inMenu) {
        drawSea(ctx, canvas);
        drawShip(ctx);
    } else if (GameState.inPort) {
        drawPortScenery(ctx, canvas);
        drawShip(ctx);
    } else {
        drawSea(ctx, canvas);
        drawShip(ctx);
        
        // Draw Entities
        GameState.splashes.forEach(s => drawSplash(ctx, s));
        GameState.enemies.forEach(e => drawEnemy(ctx, e));
        
        // Note: We draw projectiles here using a helper, not p.draw()
        GameState.projectiles.forEach(p => drawProjectile(ctx, p));
        GameState.enemyProjectiles.forEach(p => drawProjectile(ctx, p));
        
        GameState.particles.forEach(p => drawParticle(ctx, p));
    }

    // UI Layers (Guide lines)
    if (GameState.isDraggingAmmo && !GameState.inMenu && !GameState.inPort) {
        drawDragLine(ctx);
    }
}

// --- Backgrounds ---

let wavesOffset = 0;
function drawSea(ctx, canvas) {
    wavesOffset = (wavesOffset + 1) % 40;
    ctx.fillStyle = CONFIG.seaColor; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = CONFIG.waveColor; 
    ctx.lineWidth = 2; 
    ctx.beginPath();
    for(let y = -40; y < canvas.height; y += 40) {
        const drawY = y + wavesOffset;
        for(let x = 0; x < canvas.width; x += 40) {
            ctx.moveTo(x, drawY); 
            ctx.quadraticCurveTo(x+10, drawY-5, x+20, drawY); 
            ctx.quadraticCurveTo(x+30, drawY+5, x+40, drawY);
        }
    }
    ctx.stroke();
}

function drawPortScenery(ctx, canvas) {
    const ship = GameState.ship;
    
    // Sky
    ctx.fillStyle = '#0ea5e9'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Sand
    ctx.fillStyle = '#fde047'; 
    ctx.beginPath(); 
    ctx.moveTo(0, 0); 
    ctx.lineTo(canvas.width, 0); 
    ctx.lineTo(canvas.width, canvas.height * 0.3);
    for(let x = canvas.width; x >= 0; x -= 10) { 
        const y = canvas.height * 0.3 + Math.sin(x * 0.02) * 15; 
        ctx.lineTo(x, y); 
    }
    ctx.lineTo(0, canvas.height * 0.3); 
    ctx.fill();
    
    // Dock
    const dockX = (canvas.width - 80) / 2;
    ctx.fillStyle = '#78350f'; 
    ctx.fillRect(dockX, 0, 80, ship.y - 60); 
    
    // Trees
    drawPalmTree(ctx, 40, 80, 1.2); 
    drawPalmTree(ctx, canvas.width - 50, 100, 1.0); 
    drawPalmTree(ctx, canvas.width - 120, 60, 0.8);
    
    // Ropes
    ctx.strokeStyle = '#573a25'; 
    ctx.lineWidth = 2;
    ctx.beginPath(); 
    ctx.moveTo(dockX + 10, ship.y - 80); 
    ctx.lineTo(ship.x - 20, ship.y - 40); 
    ctx.stroke();
    
    ctx.beginPath(); 
    ctx.moveTo(dockX + 70, ship.y - 80); 
    ctx.lineTo(ship.x + 20, ship.y - 40); 
    ctx.stroke();
}

function drawPalmTree(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    
    // Trunk
    ctx.beginPath(); 
    ctx.moveTo(0, 0); 
    ctx.quadraticCurveTo(10, -20, 5, -60); 
    ctx.lineWidth = 6; 
    ctx.strokeStyle = '#854d0e'; 
    ctx.stroke();
    
    // Leaves
    ctx.translate(5, -60); 
    ctx.fillStyle = '#15803d';
    for(let i=0; i<5; i++) { 
        ctx.beginPath(); 
        ctx.rotate((Math.PI * 2) / 5); 
        ctx.ellipse(15, 0, 20, 5, 0, 0, Math.PI*2); 
        ctx.fill(); 
    }
    ctx.restore();
}

// --- Entities ---

function drawShip(ctx) {
    const ship = GameState.ship;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    
    if (ship.sinking) {
        ship.sinkProgress += 0.005;
        ship.sinkAngle += 0.005;
        const scale = 1 - (ship.sinkProgress * 0.5);
        ctx.rotate(ship.sinkAngle); 
        ctx.scale(scale, scale); 
        ctx.globalAlpha = 1 - ship.sinkProgress;
    } else {
        ctx.rotate(ship.rotation);
    }

    // Range indicators (only if active)
    if (!ship.sinking) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ship.slots.forEach(slot => {
            ctx.beginPath(); 
            ctx.moveTo(slot.x, slot.y); 
            ctx.arc(slot.x, slot.y, 80, slot.angle - slot.arc/2, slot.angle + slot.arc/2); 
            ctx.stroke();
        });
    }

    // Hull
    ctx.fillStyle = CONFIG.shipColor; 
    ctx.beginPath(); 
    ctx.ellipse(0, 0, ship.w/2, ship.h/2, 0, 0, Math.PI*2); 
    ctx.fill();
    
    ctx.lineWidth = 4; 
    ctx.strokeStyle = '#3e2723'; 
    ctx.stroke();
    
    ctx.fillStyle = CONFIG.deckColor; 
    ctx.beginPath(); 
    ctx.ellipse(0, 0, ship.w/2 - 5, ship.h/2 - 10, 0, 0, Math.PI*2); 
    ctx.fill();

    // Cannons
    ship.cannons.forEach((cannon) => {
        if(!ship.slots[cannon.slotIndex]) return;
        const slot = ship.slots[cannon.slotIndex];
        ctx.save();
        ctx.translate(slot.x, slot.y);
        ctx.rotate(slot.angle);
        ctx.fillStyle = '#000';
        if (slot.type === 'swivel') {
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill(); ctx.fillRect(0, -2, 10, 4);
        } else {
            ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill(); ctx.fillRect(0, -4, 15, 8); 
        }
        
        // Reload Bar
        if (cannon.loaded < 100) {
            ctx.fillStyle = 'red'; 
            ctx.fillRect(-10, -15, 20, 4); 
            ctx.fillStyle = '#0f0'; 
            ctx.fillRect(-10, -15, 20 * (cannon.loaded/100), 4);
        }
        
        // Crew Dots
        if (cannon.assignedCrew > 0) {
            ctx.fillStyle = 'white';
            for(let c=0; c<cannon.assignedCrew; c++) { 
                ctx.beginPath(); 
                ctx.arc(-5 - (c*4), 0, 2, 0, Math.PI*2); 
                ctx.fill(); 
            }
        }
        ctx.restore();
    });

    // Bilge Crew
    if (ship.bilgeCrew > 0) {
        ctx.fillStyle = '#3b82f6';
        for(let i=0; i<ship.bilgeCrew; i++) { 
            ctx.beginPath(); 
            ctx.arc((Math.random()-0.5)*20, (Math.random()-0.5)*40, 2, 0, Math.PI*2); 
            ctx.fill(); 
        }
    }

    // Touch Guide
    if (!ship.sinking && !GameState.inMenu && !GameState.inPort) {
        ctx.fillStyle = '#111'; 
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#333'; 
        ctx.beginPath(); ctx.arc(3, 3, 10, 0, Math.PI*2); ctx.fill();
    }
    
    ctx.restore();
}

function drawEnemy(ctx, enemy) {
    if (enemy.dead) return;
    const ship = GameState.ship;
    
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    const faceAngle = Math.atan2(ship.y - enemy.y, ship.x - enemy.x);
    ctx.rotate(faceAngle);

    if (enemy.type === 'serpent') {
        ctx.fillStyle = enemy.color; 
        ctx.beginPath(); ctx.ellipse(0, 0, 30, 10, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, 0, 10, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'yellow'; 
        ctx.beginPath(); ctx.arc(18, -3, 2, 0, Math.PI*2); 
        ctx.arc(18, 3, 2, 0, Math.PI*2); ctx.fill();
    } else if(enemy.type === 'boss') {
        // Boss Draw
        ctx.fillStyle = '#450a0a';
        ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-30, -15); ctx.lineTo(-30, 15); ctx.fill(); // Hull
        ctx.fillStyle = '#7f1d1d'; ctx.fillRect(-10, -10, 20, 20); // Deck
        ctx.fillStyle = '#fff'; // Skull ish shape
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
    } else {
        // Standard / Gunboat
        ctx.fillStyle = enemy.color; 
        ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-15, -10); ctx.lineTo(-15, 10); ctx.fill();
        if (enemy.type === 'gunboat') { 
            ctx.fillStyle = '#000'; 
            ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill(); 
        } else { 
            ctx.fillStyle = '#eee'; 
            ctx.fillRect(-5, -5, 10, 10); 
        }
    }
    
    ctx.rotate(-faceAngle);
    
    // HP Bar
    ctx.fillStyle = 'red'; 
    ctx.fillRect(-15, -30, 30, 4);
    ctx.fillStyle = '#0f0'; 
    ctx.fillRect(-15, -30, 30 * (enemy.hp / enemy.maxHp), 4);
    
    ctx.restore();
}

function drawProjectile(ctx, p) {
    if (p.trail.length > 0) {
        for (let i = 0; i < p.trail.length; i++) {
            let t = p.trail[i]; 
            t.age -= 0.05;
            if(t.age > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${t.age * 0.3})`;
                ctx.beginPath(); ctx.arc(t.x, t.y - t.h, 2, 0, Math.PI*2); ctx.fill();
            }
        }
    }
    ctx.save(); 
    ctx.translate(p.x, p.y);
    
    if (p.height > 0) {
        const shadowScale = 1 - (p.height / 150);
        if(shadowScale > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; 
            ctx.beginPath(); 
            ctx.ellipse(0, 0, p.size * shadowScale, p.size * 0.5 * shadowScale, 0, 0, Math.PI*2); 
            ctx.fill();
        }
    }
    
    ctx.fillStyle = '#000'; 
    ctx.beginPath(); ctx.arc(0, -p.height, p.size, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#666'; 
    ctx.beginPath(); ctx.arc(-2, -p.height - 2, 2, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}

function drawSplash(ctx, s) {
    ctx.save(); 
    ctx.translate(s.x, s.y); 
    ctx.scale(1, 0.5); 
    ctx.strokeStyle = `rgba(255, 255, 255, ${s.life})`; 
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, s.radius, 0, Math.PI*2); ctx.stroke();
    if (s.radius > 10) { 
        ctx.beginPath(); ctx.arc(0, 0, s.radius - 10, 0, Math.PI*2); ctx.stroke(); 
    }
    ctx.restore();
}

function drawParticle(ctx, p) {
    ctx.globalAlpha = p.life; 
    ctx.fillStyle = p.color; 
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); 
    ctx.globalAlpha = 1.0;
}

function drawDragLine(ctx) {
    // Now this works because we added these to GameState!
    if (GameState.isDraggingAmmo) {
        const dx = GameState.dragCurrentPos.x - GameState.dragStartPos.x;
        const dy = GameState.dragCurrentPos.y - GameState.dragStartPos.y;
        
        if (Math.hypot(dx, dy) > 10) {
            ctx.beginPath(); 
            ctx.moveTo(GameState.ship.x, GameState.ship.y); 
            ctx.lineTo(GameState.ship.x + dx, GameState.ship.y + dy);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; 
            ctx.setLineDash([5, 5]); 
            ctx.lineWidth = 3; 
            ctx.stroke(); 
            ctx.setLineDash([]);
            
            ctx.beginPath(); 
            ctx.arc(GameState.ship.x + dx, GameState.ship.y + dy, 5, 0, Math.PI*2); 
            ctx.strokeStyle = 'white'; 
            ctx.stroke();
        }
    }
}