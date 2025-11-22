// Ship entity definition
import { GameState } from '../state.js';
import { Projectile } from './Projectile.js';
import { playBoom, playCrunch } from '../systems/Audio.js';
import { updateHUD } from '../systems/UI.js';
import { Particle } from './Particle.js';

// --- UPDATED STATS CALCULATOR ---
export function getMainCannonStats() {
    const crew = GameState.ship.mainCannonCrew;
    
    // Base Stats (Level 0)
    // CHANGED: Buffed base reload speed (2500 -> 2000) to help early game
    let cooldown = 2000; 
    // NERFED: Reduced base damage from 15 to 10
    let damage = 10; 
    let speed = 6; 
    let life = 135; 

    // Crew Bonuses
    cooldown -= (crew * 400); 
    // NERFED: Reduced bonus from +8 to +5
    damage += (crew * 5); 
    
    speed += (crew * 2.2); 
    life -= (crew * 2);    
    
    // Caps
    cooldown = Math.max(250, cooldown); 
    
    return { cooldown, damage, speed, life };
}
// ----------------------------

export function updateShipStats() {
    const ship = GameState.ship;
    ship.slots = [];
    if (ship.tier >= 1) {
        ship.w = 60; ship.h = 140;
        ship.slots.push({ x: -25, y: -10, angle: Math.PI, arc: Math.PI/1.5, type: 'cannon' });
        ship.slots.push({ x: 25, y: -10, angle: 0, arc: Math.PI/1.5, type: 'cannon' });
        ship.slots.push({ x: 0, y: -50, angle: -Math.PI/2, arc: Math.PI*2, type: 'swivel' });
    }
    if (ship.tier >= 2) {
        ship.w = 70; ship.h = 160;
        ship.slots[0].y = -30; ship.slots[1].y = -30;
        ship.slots.push({ x: -25, y: 20, angle: Math.PI, arc: Math.PI/1.5, type: 'cannon' });
        ship.slots.push({ x: 25, y: 20, angle: 0, arc: Math.PI/1.5, type: 'cannon' });
        ship.slots.push({ x: 0, y: 50, angle: Math.PI/2, arc: Math.PI*2, type: 'swivel' });
    }
    if (ship.tier >= 3) {
        ship.w = 80; ship.h = 200;
        ship.slots[0].y = -60; ship.slots[1].y = -60;
        ship.slots[2].type='cannon'; ship.slots[2].y = -10;
        ship.slots[3].type='cannon'; ship.slots[3].y = -10;
        ship.slots.push({ x: -30, y: 40, angle: Math.PI, arc: Math.PI/1.5, type: 'cannon' });
        ship.slots.push({ x: 30, y: 40, angle: 0, arc: Math.PI/1.5, type: 'cannon' });
        ship.slots[4].y = 70;
    }
}

export function updateCaptain() {
    const ship = GameState.ship;
    if(!ship.hasCaptain || ship.sinking) return;
    
    let targetX = 0;
    let targetY = 0;
    const boss = GameState.enemies.find(e => e.type === 'boss' && !e.dead);
    
    if (boss) {
        targetX = boss.x;
        targetY = boss.y;
    } else {
        let sumX = 0, sumY = 0, count = 0;
        GameState.enemies.forEach(e => { if(!e.dead) { sumX += e.x; sumY += e.y; count++; } });
        
        if(count > 0) {
            targetX = sumX / count;
            targetY = sumY / count;
        } else {
            let diff = 0 - ship.rotation;
            while (diff <= -Math.PI) diff += Math.PI*2;
            while (diff > Math.PI) diff -= Math.PI*2;
            ship.rotation += diff * 0.01;
            return;
        }
    }
    
    const angleToTarget = Math.atan2(targetY - ship.y, targetX - ship.x);
    let ideal1 = angleToTarget;
    let ideal2 = angleToTarget + Math.PI;
    let current = ship.rotation;
    let diff1 = ideal1 - current;
    while (diff1 <= -Math.PI) diff1 += Math.PI*2;
    while (diff1 > Math.PI) diff1 -= Math.PI*2;
    let diff2 = ideal2 - current;
    while (diff2 <= -Math.PI) diff2 += Math.PI*2;
    while (diff2 > Math.PI) diff2 -= Math.PI*2;
    let finalDiff = (Math.abs(diff1) < Math.abs(diff2)) ? diff1 : diff2;
    ship.rotation += finalDiff * 0.015; 
}

export function takeShipDamage(amount) {
    if (GameState.ship.sinking) return;
    
    GameState.ship.hp -= amount;
    playCrunch(); 
    
    for (let i = 0; i < 10; i++) {
        GameState.particles.push(new Particle(GameState.ship.x, GameState.ship.y, '#8B4513'));
    }

    updateHUD();
    
    if (GameState.ship.hp <= 0) { 
        GameState.ship.hp = 0; 
        startSinking(); 
    }
}

function startSinking() { 
    GameState.ship.sinking = true; 
    GameState.ship.sinkProgress = 0; 
    GameState.ship.sinkAngle = 0; 
}

export function updateCrewLogistics() {
    const ship = GameState.ship;
    if(ship.sinking) return;

    let availableCrew = ship.crew;
    let crewAssignments = new Array(ship.cannons.length).fill(0);
    let bilgeAssigned = 0;
    let mainGunAssigned = 0;

    // 1. Priority: Bilge
    if (ship.bilgeLevel > 0 && ship.hp < ship.maxHp && availableCrew > 0) {
        const hpDeficitPct = 1 - (ship.hp / ship.maxHp);
        let neededForBilge = Math.ceil(availableCrew * hpDeficitPct * 1.5); 
        if (ship.hp < 30) neededForBilge = availableCrew;
        
        const capacity = ship.bilgeLevel; 
        
        bilgeAssigned = Math.min(neededForBilge, availableCrew, capacity);
        availableCrew -= bilgeAssigned;
        
        if (GameState.frameCount % 60 === 0 && bilgeAssigned > 0) {
            const repairAmt = 0.8 * bilgeAssigned * ship.bilgeLevel;
            ship.hp = Math.min(ship.hp + repairAmt, ship.maxHp);
            updateHUD(); 
        }
    }
    ship.bilgeCrew = bilgeAssigned;

    // 2. Priority: Main Cannon
    if (availableCrew > 0) {
        const capacity = ship.mainCannonLevel + 1;
        mainGunAssigned = Math.min(availableCrew, capacity);
        availableCrew -= mainGunAssigned;
    }
    ship.mainCannonCrew = mainGunAssigned;

    // 3. Priority: Auto Cannons
    let activeIndices = [];
    let idleIndices = [];

    if (ship.cannons.length > 0) {
        ship.cannons.forEach((cannon, idx) => {
            if (checkIfCannonHasTarget(cannon, ship.slots[cannon.slotIndex])) {
                activeIndices.push(idx);
            } else {
                idleIndices.push(idx);
            }
        });

        let i = 0;
        while (availableCrew > 0 && activeIndices.length > 0) {
            crewAssignments[activeIndices[i % activeIndices.length]]++;
            availableCrew--;
            i++;
        }

        i = 0;
        while (availableCrew > 0 && idleIndices.length > 0) {
            crewAssignments[idleIndices[i % idleIndices.length]]++;
            availableCrew--;
            i++;
        }
    }

    ship.cannons.forEach((cannon, i) => {
        if(!ship.slots[cannon.slotIndex]) return;
        const crewCount = crewAssignments[i];
        const slot = ship.slots[cannon.slotIndex];
        cannon.assignedCrew = crewCount; 

        if (crewCount > 0) {
            const baseFrames = (slot.type === 'swivel') ? 180 : 240;
            const reduction = (crewCount - 1) * 30;
            let finalFrames = Math.max(30, baseFrames - reduction);
            cannon.loaded += (100 / finalFrames);
        }

        if (cannon.loaded >= 100) {
            fireCannonIfTargetFound(cannon, slot);
        }
    });
    
    const idle = Math.max(0, availableCrew);
    document.getElementById('idleCrew').innerText = `Idle: ${idle} | Main: ${ship.mainCannonCrew}/${ship.mainCannonLevel + 1}`;
}

function checkIfCannonHasTarget(cannon, slot) {
    const ship = GameState.ship;
    const cos = Math.cos(ship.rotation); 
    const sin = Math.sin(ship.rotation);
    const rx = slot.x * cos - slot.y * sin; 
    const ry = slot.x * sin + slot.y * cos;
    const cx = ship.x + rx; 
    const cy = ship.y + ry;
    const cAngle = slot.angle + ship.rotation;

    for(let e of GameState.enemies) {
        if(e.dead) continue;
        const dist = Math.hypot(e.x - cx, e.y - cy);
        if(dist < 700) {
            let angleToEnemy = Math.atan2(e.y - cy, e.x - cx);
            let angleDiff = angleToEnemy - cAngle;
            while (angleDiff <= -Math.PI) angleDiff += Math.PI*2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI*2;
            if (Math.abs(angleDiff) < slot.arc / 2) { 
                return true; 
            }
        }
    }
    return false;
}

function fireCannonIfTargetFound(cannon, slot) {
    const ship = GameState.ship;
    const cos = Math.cos(ship.rotation); 
    const sin = Math.sin(ship.rotation);
    const rx = slot.x * cos - slot.y * sin; 
    const ry = slot.x * sin + slot.y * cos;
    const cx = ship.x + rx; 
    const cy = ship.y + ry;
    const cAngle = slot.angle + ship.rotation;

    let bestTarget = null; 
    let minDist = 700; 
    
    for(let e of GameState.enemies) {
        if(e.dead) continue;
        const dist = Math.hypot(e.x - cx, e.y - cy);
        if(dist < minDist) {
            let angleToEnemy = Math.atan2(e.y - cy, e.x - cx);
            let angleDiff = angleToEnemy - cAngle;
            while (angleDiff <= -Math.PI) angleDiff += Math.PI*2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI*2;
            if (Math.abs(angleDiff) < slot.arc / 2) { minDist = dist; bestTarget = e; }
        }
    }

    if (bestTarget) {
        const angle = Math.atan2(bestTarget.y - cy, bestTarget.x - cx);
        const dmg = (slot.type === 'swivel') ? 5 : 10;
        const speed = 8; 
        const p = new Projectile(cx, cy, Math.cos(angle)*speed, Math.sin(angle)*speed, false, dmg);
        p.size = 4; p.gravity = 0.1;
        GameState.projectiles.push(p);
        playBoom(slot.type === 'swivel');
        cannon.loaded = 0; 
    } else {
        cannon.loaded = 100; 
    }
}