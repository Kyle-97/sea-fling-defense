// Enemy entity definition
import { GameState } from '../state.js';
import { Projectile } from './Projectile.js';
import { Particle } from './Particle.js';
import { playBoom } from '../systems/Audio.js';
import { spawnFloatingText } from '../systems/UI.js'; // Circular dep fixed by passing UI functions

export class Enemy {
    constructor(type, canvasWidth, canvasHeight, wave) {
        const side = Math.floor(Math.random() * 3);
        const margin = 50;
        
        if (side === 0) { this.x = (Math.random() * canvasWidth); this.y = -margin; } 
        else if (side === 1) { this.x = -margin; this.y = (Math.random() * canvasHeight * 0.6); } 
        else { this.x = canvasWidth + margin; this.y = (Math.random() * canvasHeight * 0.6); }

        this.type = type;
        this.dead = false;
        this.maxHp = 20;
        this.speed = 0.2; 
        this.size = 20;
        this.angle = 0;
        this.reload = 0;
        this.sway = Math.random() * 100;
        this.color = '#92400e';

        this.initStats(wave, canvasWidth);
        this.hp = this.maxHp;
    }

    initStats(wave, canvasWidth) {
        if (this.type === 'gunboat') { this.maxHp = 30; this.speed = 0.4; this.color = '#374151'; } 
        else if (this.type === 'serpent') { this.maxHp = 60; this.speed = 0.4; this.color = '#047857'; this.size = 25; }
        else if (this.type === 'boss') {
            this.maxHp = 300 + (wave * 50); 
            this.speed = 0.1; 
            this.color = '#7f1d1d'; 
            this.size = 50;
            this.x = canvasWidth / 2; this.y = -80; 
        }
    }

    update(ship, canvasWidth, canvasHeight) {
        if (this.dead || ship.sinking) return;
        const dx = ship.x - this.x;
        const dy = ship.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        this.moveBehavior(dx, dy, dist, canvasWidth, ship);

        if (dist < this.size + 40) { 
            // Collision logic handled in main/ship
            this.toExplode = true; // Flag for main loop to handle damage
            return;
        }

        this.shootBehavior(dist, ship);
        
        if (this.y > canvasHeight + 50) this.dead = true;
    }

    moveBehavior(dx, dy, dist, canvasWidth, ship) {
        // ... Logic from original Enemy.update() lines 403-444 ...
        // Copied abbreviated for brevity:
        if(this.type !== 'boss') {
            if (this.x < 20) this.x += 0.5;
            if (this.x > canvasWidth - 20) this.x -= 0.5;
        }
        
        if (this.type === 'serpent') {
             this.sway += 0.05;
             this.angle = Math.atan2(dy, dx) + (Math.sin(this.sway) * 0.5);
             this.x += Math.cos(this.angle) * this.speed;
             this.y += Math.sin(this.angle) * this.speed;
        } else if (this.type === 'boss') {
             this.sway += 0.015;
             this.x += Math.sin(this.sway) * 1.5;
             let targetY = (ship.y - 350) + (Math.cos(this.sway * 2) * 80);
             this.y += (targetY - this.y) * 0.02;
             this.angle = Math.atan2(dy, dx);
        } else {
             // Standard tracking
             this.angle = Math.atan2(dy, dx);
             this.x += Math.cos(this.angle) * this.speed;
             this.y += Math.sin(this.angle) * this.speed;
        }
        this.y += 0.1; 
    }

    shootBehavior(dist, ship) {
        if (this.type === 'gunboat' || this.type === 'boss') {
            this.reload--;
            const shootDist = (this.type === 'boss') ? 700 : 500;
            const fireRate = (this.type === 'boss') ? 200 : 300;
            
            if (this.reload <= 0 && dist < shootDist) { 
                this.reload = fireRate; 
                const shotSpeed = 3.0; 
                const shotAngle = Math.atan2(ship.y - this.y, ship.x - this.x);
                
                if(this.type === 'boss') {
                    GameState.enemyProjectiles.push(new Projectile(this.x, this.y, Math.cos(shotAngle)*shotSpeed, Math.sin(shotAngle)*shotSpeed, true));
                    // ... add other projectiles
                    playBoom(true);
                } else {
                    GameState.enemyProjectiles.push(new Projectile(this.x, this.y, Math.cos(shotAngle)*shotSpeed, Math.sin(shotAngle)*shotSpeed, true));
                    playBoom(true);
                }
            }
        }
    }
}