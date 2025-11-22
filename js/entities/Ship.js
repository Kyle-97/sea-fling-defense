// Ship entity definition
import { GameState } from '../state.js';
import { Projectile } from './Projectile.js';
import { playBoom } from '../systems/Audio.js';

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
    
    // ... Logic from updateCaptain() lines 643-680 ...
    // Simplified for brevity:
    let targetX = 0, targetY = 0;
    const boss = GameState.enemies.find(e => e.type === 'boss' && !e.dead);
    
    if (boss) { targetX = boss.x; targetY = boss.y; }
    else {
        let sumX = 0, sumY = 0, count = 0;
        GameState.enemies.forEach(e => { if(!e.dead) { sumX += e.x; sumY += e.y; count++; } });
        if(count > 0) { targetX = sumX / count; targetY = sumY / count; }
        else return;
    }
    
    const angleToTarget = Math.atan2(targetY - ship.y, targetX - ship.x);
    let ideal1 = angleToTarget;
    let ideal2 = angleToTarget + Math.PI;
    
    let current = ship.rotation;
    let diff1 = ideal1 - current;
    while (diff1 <= -Math.PI) diff1 += Math.PI*2; while (diff1 > Math.PI) diff1 -= Math.PI*2;
    
    let diff2 = ideal2 - current;
    while (diff2 <= -Math.PI) diff2 += Math.PI*2; while (diff2 > Math.PI) diff2 -= Math.PI*2;
    
    let finalDiff = (Math.abs(diff1) < Math.abs(diff2)) ? diff1 : diff2;
    ship.rotation += finalDiff * 0.015; 
}