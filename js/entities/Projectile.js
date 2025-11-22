// Projectile entity definition

import { GameState } from '../state.js';
import { Splash } from './Particle.js';
import { Particle } from './Particle.js';
import { playSplash, playCrunch } from '../systems/Audio.js';

export class Projectile {
    constructor(x, y, vx, vy, isEnemy = false, damage = 10) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.isEnemy = isEnemy; this.active = true; this.life = 180; 
        this.size = isEnemy ? 4 : 8; this.height = 10; this.zVel = isEnemy ? 2 : 4; 
        this.gravity = isEnemy ? 0.1 : 0.15; 
        this.damage = damage;
        this.trail = [];
    }

    update() {
        if (GameState.frameCount % 3 === 0 && !this.isEnemy && this.height > 0) {
            this.trail.push({x: this.x, y: this.y, h: this.height, age: 1.0});
        }
        this.x += this.vx; this.y += this.vy;
        
        if (this.height > -5) { this.height += this.zVel; this.zVel -= this.gravity; }
        
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
    }
}