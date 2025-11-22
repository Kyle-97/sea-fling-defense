// Projectile entity definition
import { GameState } from '../state.js';
import { Splash, Particle } from './Particle.js';
import { playSplash, playCrunch } from '../systems/Audio.js';
import { takeShipDamage } from './Ship.js'; 

export class Projectile {
    constructor(x, y, vx, vy, isEnemy = false, damage = 10) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.isEnemy = isEnemy; this.active = true; this.life = 250; // Increased life for slower travel
        this.size = isEnemy ? 4 : 8; this.height = 10; 
        
        // UPDATED PHYSICS:
        // Enemy: Higher arc (zVel 4 instead of 2) to reach far.
        // Gravity: Lowered for everyone (0.08 instead of 0.15/0.1) so projectiles float longer.
        this.zVel = isEnemy ? 4 : 4; 
        this.gravity = 0.08; 
        
        this.damage = damage;
        this.trail = [];
    }

    update() {
        if (GameState.frameCount % 3 === 0 && !this.isEnemy && this.height > 0) {
            this.trail.push({x: this.x, y: this.y, h: this.height, age: 1.0});
        }
        this.x += this.vx; this.y += this.vy;
        
        // Physics
        if (this.height > -5) { this.height += this.zVel; this.zVel -= this.gravity; }
        
        // Water / Splash logic
        if (this.height <= 0) {
            if (this.active && this.zVel < 0 && this.height > -3) {
                if (!this.isEnemy) { 
                    GameState.splashes.push(new Splash(this.x, this.y)); 
                    playSplash(); 
                } else {
                    GameState.particles.push(new Particle(this.x, this.y, '#fff', 1));
                }
            }
            this.height = -1; this.vx *= 0.8; this.vy *= 0.8; this.life -= 15; 
        }
        if (this.life <= 0) this.active = false;

        // --- COLLISION LOGIC ---
        const hitHeightThreshold = this.isEnemy ? 30 : 100; 
        
        if (this.active && this.height < hitHeightThreshold && this.height > -5) { 
            if (this.isEnemy) {
                // Enemy shooting Player
                if (GameState.ship.sinking) return;
                const ship = GameState.ship;
                const hitW = ship.w * 1.2; 
                const hitH = ship.h * 1.2;
                
                if (this.x > ship.x - hitW/2 && this.x < ship.x + hitW/2 &&
                    this.y > ship.y - hitH/2 && this.y < ship.y + hitH/2) {
                    takeShipDamage(5); 
                    this.active = false;
                }
            } else {
                // Player shooting Enemies
                for (let e of GameState.enemies) {
                    if (!e.dead && Math.hypot(e.x - this.x, e.y - this.y) < e.size + this.size + 30) {
                        e.takeDamage(this.damage);
                        
                        // Hit FX
                        for(let i=0; i<10; i++) {
                            GameState.particles.push(new Particle(this.x, this.y, '#f59e0b', 2 + Math.random())); 
                        }
                        playCrunch(); 
                        this.active = false; 
                        break;
                    }
                }
            }
        }
    }
}