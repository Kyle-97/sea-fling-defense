// Enemy entity definition
import { GameState } from '../state.js';
import { Projectile } from './Projectile.js';
import { Particle } from './Particle.js';
import { playBoom } from '../systems/Audio.js';
import { spawnFloatingText, addGold } from '../systems/UI.js';
import { takeShipDamage } from './Ship.js';

export class Enemy {
    constructor(type, canvasWidth, canvasHeight, wave) {
        const side = Math.floor(Math.random() * 3);
        const margin = 50;
        
        if (side === 0) { this.x = (Math.random() * canvasWidth); this.y = -margin; } 
        else if (side === 1) { this.x = -margin; this.y = (Math.random() * canvasHeight * 0.6); } 
        else { this.x = canvasWidth + margin; this.y = (Math.random() * canvasHeight * 0.6); }

        this.type = type;
        this.wave = wave; // Store wave for difficulty scaling logic
        this.dead = false;
        this.maxHp = 20;
        
        this.speed = 0.3; 
        
        this.size = 20;
        this.angle = 0;
        this.reload = 0;
        this.sway = Math.random() * 100;
        this.color = '#92400e';
        
        // BOSS SPECIFIC
        this.bossOrbitDir = Math.random() < 0.5 ? 1 : -1;
        this.currentRotation = 0; 
        
        this.initStats(wave, canvasWidth);
        this.hp = this.maxHp;

        if (canvasWidth < 600) {
            this.speed *= 0.7;
        }
    }

    initStats(wave, canvasWidth) {
        // STEPWISE SCALING
        const waveScaling = Math.floor(wave / 5) * 15; 

        if (this.type === 'gunboat') { 
            this.maxHp = 30 + waveScaling; 
            this.speed = 0.4; 
            this.color = '#374151'; 
            this.size = 12; 
        } 
        else if (this.type === 'serpent') { 
            this.maxHp = 60 + (waveScaling * 1.5); 
            this.speed = 0.4; 
            this.color = '#047857'; 
            this.size = 25; 
        }
        else if (this.type === 'boss') {
            // Reduced Base Health: Was 150 + (wave*35)
            // Now slightly easier early on
            this.maxHp = 100 + (wave * 30); 
            this.speed = 0.15; 
            this.color = '#7f1d1d'; 
            this.size = 50;
            this.x = canvasWidth / 2; this.y = -80; 
        }
        else {
            this.maxHp = 20 + waveScaling;
        }
    }

    update(ship, canvasWidth, canvasHeight) {
        if (this.dead || ship.sinking) return;
        const dx = ship.x - this.x;
        const dy = ship.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        this.moveBehavior(dx, dy, dist, canvasWidth, canvasHeight, ship);

        if (dist < this.size + 40) { 
            takeShipDamage(5); 
            for(let i=0; i<15; i++) {
                GameState.particles.push(new Particle(this.x, this.y, '#fff'));
            }
            if(this.type !== 'boss') { this.dead = true; } 
            return;
        }

        this.shootBehavior(dist, ship);
        
        if (this.y > canvasHeight + 50) this.dead = true;
    }

    takeDamage(amt) {
        this.hp -= amt;
        if (this.hp <= 0) {
            this.dead = true; 
            GameState.enemiesKilled++;
            
            let val = 10;
            if(this.type === 'gunboat') val = 25;
            if(this.type === 'serpent') val = 40;
            if(this.type === 'boss') val = 500; 
            
            addGold(val);
            
            for(let i=0; i<10; i++) {
                GameState.particles.push(new Particle(this.x, this.y, this.color));
            }
            
            if(this.type === 'boss') {
                spawnFloatingText(this.x, this.y, "BOSS DEFEATED!", "#ffff00");
            }
        }
    }

    moveBehavior(dx, dy, dist, canvasWidth, canvasHeight, ship) {
        const minDim = Math.min(canvasWidth, canvasHeight);
        const engageDist = minDim * 0.45; 
        const closeDist = minDim * 0.25;  
        
        if(this.type !== 'boss') {
            if (this.x < 20) this.x += 0.1;
            if (this.x > canvasWidth - 20) this.x -= 0.1;
        }
        
        if (this.type === 'serpent') {
             this.sway += 0.05;
             this.angle = Math.atan2(dy, dx) + (Math.sin(this.sway) * 0.5);
             this.x += Math.cos(this.angle) * this.speed;
             this.y += Math.sin(this.angle) * this.speed;
        } else if (this.type === 'boss') {
             // --- BOSS SAILING LOGIC ---
             let desiredAngle = Math.atan2(dy, dx) + (Math.PI / 2 * this.bossOrbitDir);
             const orbitRadius = minDim * 0.45; 
             const minSafeDist = minDim * 0.35; 

             if (dist < minSafeDist) { desiredAngle = Math.atan2(-dy, -dx); } 
             else if (dist < orbitRadius) { desiredAngle += (0.3 * -this.bossOrbitDir); } 
             else if (dist > orbitRadius + 50) { desiredAngle += (0.2 * this.bossOrbitDir); }

             let vx = Math.cos(desiredAngle);
             let vy = Math.sin(desiredAngle);
             
             const xBuffer = 40; 
             const maxSteer = 0.6; 
             if (this.x < -xBuffer) vx += maxSteer; 
             if (this.x > canvasWidth + xBuffer) vx -= maxSteer; 

             const yMargin = 50;
             if (this.y < yMargin) {
                 let strength = (yMargin - this.y) / yMargin;
                 vy += strength * maxSteer;
             }
             if (this.y > canvasHeight - yMargin) {
                 let strength = (this.y - (canvasHeight - yMargin)) / yMargin;
                 vy -= strength * maxSteer;
             }
             
             this.angle = Math.atan2(vy, vx);
             this.x += Math.cos(this.angle) * this.speed * 3.0; 
             this.y += Math.sin(this.angle) * this.speed * 3.0;

             let diff = this.angle - this.currentRotation;
             while (diff <= -Math.PI) diff += Math.PI*2;
             while (diff > Math.PI) diff -= Math.PI*2;
             this.currentRotation += diff * 0.1;

             const pad = -50;
             this.x = Math.max(pad, Math.min(canvasWidth - pad, this.x));
             this.y = Math.max(pad, Math.min(canvasHeight - pad, this.y));
             
        } else if (this.type === 'gunboat') {
            if (dist > engageDist) this.angle = Math.atan2(dy, dx);
            else if (dist < closeDist) this.angle = Math.atan2(dy, dx) + Math.PI;
            else this.angle = Math.atan2(dy, dx) + (Math.PI / 2) + 0.1; 
            
            const orbitSpeed = (dist <= engageDist && dist >= closeDist) ? this.speed * 1.5 : this.speed;
            this.x += Math.cos(this.angle) * orbitSpeed;
            this.y += Math.sin(this.angle) * orbitSpeed;
        } else {
             this.angle = Math.atan2(dy, dx);
             this.x += Math.cos(this.angle) * this.speed;
             this.y += Math.sin(this.angle) * this.speed;
        }
        
        if(this.type !== 'boss') this.y += 0.05; 
    }

    shootBehavior(dist, ship) {
        this.reload--;
        
        // --- BOSS FIRING LOGIC ---
        if (this.type === 'boss') {
             // Dynamic Difficulty Configuration
             let fireRate = 120;       // Default: 2.0s
             let offsets = [-25, 0, 25]; // Default: 3 Cannons
             
             if (this.wave <= 5) {
                 fireRate = 180;      // Wave 5: 3.0s (Slow)
                 offsets = [0];       // Wave 5: 1 Cannon
             } else if (this.wave <= 10) {
                 fireRate = 150;      // Wave 10: 2.5s (Medium)
                 offsets = [-15, 15]; // Wave 10: 2 Cannons
             }
             // Wave 15+ uses defaults (Fast & 3 Cannons)

             const shootDist = 800;
             
             if (this.reload <= 0 && dist < shootDist) {
                 this.reload = fireRate;
                 
                 // Inaccuracy
                 const accuracyError = (Math.random() - 0.5) * 0.5;
                 const aimAngle = Math.atan2(ship.y - this.y, ship.x - this.x) + accuracyError;

                 const shipFacing = this.currentRotation;
                 
                 // Aim Calculation
                 const g = 0.1;
                 const zVel = 4.0; 
                 const flightTime = (2 * zVel) / g; 
                 const requiredSpeed = (dist / flightTime) * 0.95;

                 offsets.forEach(offset => {
                    const spawnX = this.x + Math.cos(shipFacing) * offset;
                    const spawnY = this.y + Math.sin(shipFacing) * offset;
                    
                    GameState.enemyProjectiles.push(new Projectile(spawnX, spawnY, 
                        Math.cos(aimAngle)*requiredSpeed, 
                        Math.sin(aimAngle)*requiredSpeed, 
                        true, 5));
                 });
                 
                 playBoom(true); 
             }
        }
        // --- GUNBOAT FIRING LOGIC ---
        else if (this.type === 'gunboat') {
             const shootDist = 500;
             const fireRate = 300;
             
             if (this.reload <= 0 && dist < shootDist) {
                 this.reload = fireRate;

                 const accuracyError = (Math.random() - 0.5) * 0.5;
                 const aimAngle = Math.atan2(ship.y - this.y, ship.x - this.x) + accuracyError;

                 const g = 0.1;
                 const zVel = 4.0; 
                 const flightTime = (2 * zVel) / g; 
                 const requiredSpeed = (dist / flightTime) * 0.95;
                 
                 GameState.enemyProjectiles.push(new Projectile(this.x, this.y, Math.cos(aimAngle)*requiredSpeed, Math.sin(aimAngle)*requiredSpeed, true, 5));
                 playBoom(true);
             }
        }
    }
}