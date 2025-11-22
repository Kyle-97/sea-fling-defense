// Renderer system for Sea Fling Defense
import { CONFIG } from '../constants.js';
import { GameState } from '../state.js';
import { getMainCannonStats } from '../entities/Ship.js'; 

export function drawGame(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (CONFIG.zoom !== 1.0) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        ctx.translate(cx, cy);
        ctx.scale(CONFIG.zoom, CONFIG.zoom);
        ctx.translate(-cx, -cy);
    }

    if (GameState.inMenu) {
        drawSea(ctx, canvas);
        drawShip(ctx);
    } else if (GameState.inPort) {
        drawPortScenery(ctx, canvas);
        drawShip(ctx);
    } else {
        drawSea(ctx, canvas);
        drawShip(ctx);
        drawReloadBar(ctx); 
        
        GameState.splashes.forEach(s => drawSplash(ctx, s));
        GameState.enemies.forEach(e => drawEnemy(ctx, e));
        GameState.projectiles.forEach(p => drawProjectile(ctx, p));
        GameState.enemyProjectiles.forEach(p => drawProjectile(ctx, p));
        GameState.particles.forEach(p => drawParticle(ctx, p));
    }

    if (GameState.isDraggingAmmo && !GameState.inMenu && !GameState.inPort) {
        drawDragLine(ctx);
    }

    ctx.restore(); 
}

let wavesOffset = 0;
function drawSea(ctx, canvas) {
    wavesOffset = (wavesOffset + 1) % 40;
    
    const renderW = canvas.width * (1 / CONFIG.zoom) + 200;
    const renderH = canvas.height * (1 / CONFIG.zoom) + 200;
    const startX = -100;
    const startY = -100;

    ctx.fillStyle = CONFIG.seaColor; 
    ctx.fillRect(startX, startY, renderW, renderH);
    
    ctx.strokeStyle = CONFIG.waveColor; 
    ctx.lineWidth = 2; 
    ctx.beginPath();
    for(let y = -40; y < renderH; y += 40) {
        const drawY = startY + y + wavesOffset;
        for(let x = 0; x < renderW; x += 40) {
            const drawX = startX + x;
            ctx.moveTo(drawX, drawY); 
            ctx.quadraticCurveTo(drawX+10, drawY-5, drawX+20, drawY); 
            ctx.quadraticCurveTo(drawX+30, drawY+5, drawX+40, drawY);
        }
    }
    ctx.stroke();
}

function drawPortScenery(ctx, canvas) {
    const ship = GameState.ship;
    
    ctx.fillStyle = '#0ea5e9'; 
    ctx.fillRect(-1000, -1000, canvas.width + 2000, canvas.height + 2000);
    
    ctx.fillStyle = '#fde047'; 
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(canvas.width, 0); 
    ctx.lineTo(canvas.width, canvas.height * 0.3);
    for(let x = canvas.width; x >= 0; x -= 10) { 
        const y = canvas.height * 0.3 + Math.sin(x * 0.02) * 15; 
        ctx.lineTo(x, y); 
    }
    ctx.lineTo(0, canvas.height * 0.3); ctx.fill();
    
    const dockX = (canvas.width - 80) / 2;
    ctx.fillStyle = '#78350f'; ctx.fillRect(dockX, 0, 80, ship.y - 60); 
    
    drawPalmTree(ctx, 40, 80, 1.2); 
    drawPalmTree(ctx, canvas.width - 50, 100, 1.0); 
    drawPalmTree(ctx, canvas.width - 120, 60, 0.8);
    
    ctx.strokeStyle = '#573a25'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(dockX + 10, ship.y - 80); ctx.lineTo(ship.x - 20, ship.y - 40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(dockX + 70, ship.y - 80); ctx.lineTo(ship.x + 20, ship.y - 40); ctx.stroke();
}

function drawPalmTree(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -20, 5, -60); 
    ctx.lineWidth = 6; ctx.strokeStyle = '#854d0e'; ctx.stroke();
    ctx.translate(5, -60); ctx.fillStyle = '#15803d';
    for(let i=0; i<5; i++) { 
        ctx.beginPath(); ctx.rotate((Math.PI * 2) / 5); 
        ctx.ellipse(15, 0, 20, 5, 0, 0, Math.PI*2); ctx.fill(); 
    }
    ctx.restore();
}

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

    if (!ship.sinking) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ship.slots.forEach(slot => {
            ctx.beginPath(); 
            ctx.moveTo(slot.x, slot.y); 
            ctx.arc(slot.x, slot.y, 80, slot.angle - slot.arc/2, slot.angle + slot.arc/2); 
            ctx.stroke();
        });
    }

    ctx.fillStyle = CONFIG.shipColor; 
    ctx.beginPath(); ctx.ellipse(0, 0, ship.w/2, ship.h/2, 0, 0, Math.PI*2); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#3e2723'; ctx.stroke();
    ctx.fillStyle = CONFIG.deckColor; 
    ctx.beginPath(); ctx.ellipse(0, 0, ship.w/2 - 5, ship.h/2 - 10, 0, 0, Math.PI*2); ctx.fill();

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
        
        if (cannon.loaded < 100) {
            ctx.fillStyle = 'red'; ctx.fillRect(-10, -15, 20, 4); 
            ctx.fillStyle = '#0f0'; ctx.fillRect(-10, -15, 20 * (cannon.loaded/100), 4);
        }
        
        if (cannon.assignedCrew > 0) {
            ctx.fillStyle = 'white';
            for(let c=0; c<cannon.assignedCrew; c++) { 
                ctx.beginPath(); ctx.arc(-5 - (c*4), 0, 2, 0, Math.PI*2); ctx.fill(); 
            }
        }
        ctx.restore();
    });

    if (ship.mainCannonCrew > 0) {
        ctx.fillStyle = '#fbbf24'; 
        for(let i=0; i<ship.mainCannonCrew; i++) {
            ctx.beginPath();
            const ox = (i % 2 === 0 ? -6 : 6);
            const oy = -20 + (Math.floor(i/2) * 10);
            ctx.arc(ox, oy, 3, 0, Math.PI*2); 
            ctx.fill();
        }
    }

    if (ship.bilgeCrew > 0) {
        ctx.fillStyle = '#3b82f6';
        for(let i=0; i<ship.bilgeCrew; i++) { 
            ctx.beginPath(); ctx.arc((Math.random()-0.5)*20, (Math.random()-0.5)*40, 2, 0, Math.PI*2); ctx.fill(); 
        }
    }

    if (!ship.sinking && !GameState.inMenu && !GameState.inPort) {
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(3, 3, 10, 0, Math.PI*2); ctx.fill();
    }
    
    ctx.restore();
}

function drawReloadBar(ctx) {
    if(GameState.ship.sinking) return;

    const now = Date.now();
    const stats = getMainCannonStats();
    const cooldownTotal = stats.cooldown;
    const timeSinceFire = now - GameState.lastFireTime;
    let pct = timeSinceFire / cooldownTotal;
    if (pct > 1) pct = 1;

    const barW = 50;
    const barH = 6;
    const x = GameState.ship.x - barW/2;
    const y = GameState.ship.y + 90; 

    ctx.fillStyle = '#374151'; 
    ctx.fillRect(x, y, barW, barH);

    if (pct >= 1) {
        ctx.fillStyle = '#22c55e'; 
    } else {
        ctx.fillStyle = '#eab308'; 
    }
    ctx.fillRect(x, y, barW * pct, barH);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barW, barH);
}

function drawEnemy(ctx, enemy) {
    if (enemy.dead) return;
    const ship = GameState.ship;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    
    // Rotation Logic:
    // Basic enemies face the player.
    // Boss faces its movement direction (broadside to player).
    let rotationAngle = 0;
    if (enemy.type === 'boss') {
        // Use the angle stored in update() which is the movement vector
        rotationAngle = enemy.currentRotation;
    } else {
        rotationAngle = Math.atan2(ship.y - enemy.y, ship.x - enemy.x);
    }
    
    ctx.rotate(rotationAngle);

    if (enemy.type === 'serpent') {
        ctx.fillStyle = enemy.color; 
        ctx.beginPath(); ctx.ellipse(0, 0, 30, 10, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, 0, 10, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'yellow'; ctx.beginPath(); ctx.arc(18, -3, 2, 0, Math.PI*2); ctx.arc(18, 3, 2, 0, Math.PI*2); ctx.fill();

        // --- ADDED HP BAR FOR SERPENT ---
        ctx.rotate(-rotationAngle); // Un-rotate for UI
        ctx.fillStyle = 'red'; ctx.fillRect(-20, -35, 40, 5); // Slightly larger bar
        ctx.fillStyle = '#0f0'; ctx.fillRect(-20, -35, 40 * (enemy.hp / enemy.maxHp), 5);
        // --------------------------------

    } else if(enemy.type === 'boss') {
        // --- SHIP-LIKE BOSS VISUAL ---
        
        // 1. Hull (Elongated oval/ship shape)
        ctx.fillStyle = '#2a0a0a'; // Very dark wood
        ctx.beginPath();
        ctx.ellipse(0, 0, 50, 20, 0, 0, Math.PI*2); 
        ctx.fill();
        ctx.strokeStyle = '#5c2b0c';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 2. Beakhead (Front)
        ctx.beginPath();
        ctx.moveTo(40, -10);
        ctx.lineTo(60, 0);
        ctx.lineTo(40, 10);
        ctx.fill();
        
        // 3. Stern / Captain's Quarters (Back)
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(-45, -15, 20, 30);
        // Windows
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-45, -5, 5, 10);

        // 4. Masts (3 circles)
        ctx.fillStyle = '#d4d4d4'; // White sails (furled/top view)
        ctx.beginPath(); ctx.arc(-20, 0, 6, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, 0, 8, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(35, 0, 5, 0, Math.PI*2); ctx.fill();
        
        // 5. Cannon Ports (Broadside)
        ctx.fillStyle = '#000';
        // Left side
        ctx.beginPath(); ctx.arc(-15, -18, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, -20, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(25, -18, 2, 0, Math.PI*2); ctx.fill();
        // Right side
        ctx.beginPath(); ctx.arc(-15, 18, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, 20, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(25, 18, 2, 0, Math.PI*2); ctx.fill();
        
        // HP Bar (Fixed rotation so it doesn't spin with ship)
        ctx.rotate(-rotationAngle); // Undo rotation for UI
        ctx.fillStyle = 'red'; ctx.fillRect(-25, -60, 50, 6);
        ctx.fillStyle = '#0f0'; ctx.fillRect(-25, -60, 50 * (enemy.hp / enemy.maxHp), 6);
        ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.strokeRect(-25, -60, 50, 6);
        
    } else {
        ctx.fillStyle = enemy.color; 
        ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-15, -10); ctx.lineTo(-15, 10); ctx.fill();
        if (enemy.type === 'gunboat') { 
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill(); 
        } else { 
            ctx.fillStyle = '#eee'; ctx.fillRect(-5, -5, 10, 10); 
        }
        
        // Standard HP bar
        ctx.rotate(-rotationAngle);
        ctx.fillStyle = 'red'; ctx.fillRect(-15, -30, 30, 4);
        ctx.fillStyle = '#0f0'; ctx.fillRect(-15, -30, 30 * (enemy.hp / enemy.maxHp), 4);
    }
    
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
    ctx.save(); ctx.translate(p.x, p.y);
    if (p.height > 0) {
        const shadowScale = 1 - (p.height / 150);
        if(shadowScale > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; 
            ctx.beginPath(); ctx.ellipse(0, 0, p.size * shadowScale, p.size * 0.5 * shadowScale, 0, 0, Math.PI*2); ctx.fill();
        }
    }
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, -p.height, p.size, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#666'; ctx.beginPath(); ctx.arc(-2, -p.height - 2, 2, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}

function drawSplash(ctx, s) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.scale(1, 0.5); 
    ctx.strokeStyle = `rgba(255, 255, 255, ${s.life})`; 
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, s.radius, 0, Math.PI*2); ctx.stroke();
    if (s.radius > 10) { ctx.beginPath(); ctx.arc(0, 0, s.radius - 10, 0, Math.PI*2); ctx.stroke(); }
    ctx.restore();
}

function drawParticle(ctx, p) {
    ctx.globalAlpha = p.life; ctx.fillStyle = p.color; 
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); 
    ctx.globalAlpha = 1.0;
}

function drawDragLine(ctx) {
    if (GameState.isDraggingAmmo) {
        const dx = GameState.dragCurrentPos.x - GameState.dragStartPos.x;
        const dy = GameState.dragCurrentPos.y - GameState.dragStartPos.y;
        
        if (Math.hypot(dx, dy) > 10) {
            ctx.beginPath(); ctx.moveTo(GameState.ship.x, GameState.ship.y); 
            ctx.lineTo(GameState.ship.x + dx, GameState.ship.y + dy);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; ctx.setLineDash([5, 5]); 
            ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
            ctx.beginPath(); ctx.arc(GameState.ship.x + dx, GameState.ship.y + dy, 5, 0, Math.PI*2); 
            ctx.strokeStyle = 'white'; ctx.stroke();
        }
    }
}